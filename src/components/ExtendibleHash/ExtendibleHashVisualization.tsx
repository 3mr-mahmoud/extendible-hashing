import React, { useState, useCallback, useEffect, useRef } from 'react';
import './ExtendibleHash.css';

interface HashEntry {
  key: number;
  hash: number;
  binaryHash: string;
}

interface Bucket {
  id: number;
  localDepth: number;
  binaryAddress: string;
  entries: HashEntry[];
  maxCapacity: number;
}

interface DirectoryEntry {
  binaryAddress: string;
  bucketId: number;
}

interface ExtendibleHashState {
  globalDepth: number;
  maxGlobalDepth: number;
  bucketCapacity: number;
  hashModulo: number;
  buckets: Map<number, Bucket>;
  directory: DirectoryEntry[];
  nextBucketId: number;
}

const ExtendibleHashVisualization: React.FC = () => {
  // Configuration state
  const [hashModulo, setHashModulo] = useState(32);
  const [maxGlobalDepth, setMaxGlobalDepth] = useState(5);
  const [bucketCapacity, setBucketCapacity] = useState(2);
  const [newKey, setNewKey] = useState<string>('');
  const [animatingBucket, setAnimatingBucket] = useState<number | null>(null);
  const [newlyCreatedBucket, setNewlyCreatedBucket] = useState<number | null>(null);
  const [hashPreview, setHashPreview] = useState<{hash: number, binary: string} | null>(null);
  const [collisionMessage, setCollisionMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize empty hash structure with 2 buckets
  const initializeHash = useCallback((): ExtendibleHashState => {
    const bucket0: Bucket = {
      id: 0,
      localDepth: 1,
      binaryAddress: '0',
      entries: [],
      maxCapacity: bucketCapacity,
    };
    
    const bucket1: Bucket = {
      id: 1,
      localDepth: 1,
      binaryAddress: '1',
      entries: [],
      maxCapacity: bucketCapacity,
    };

    return {
      globalDepth: 1,
      maxGlobalDepth,
      bucketCapacity,
      hashModulo,
      buckets: new Map([[0, bucket0], [1, bucket1]]),
      directory: [
        { binaryAddress: '0', bucketId: 0 },
        { binaryAddress: '1', bucketId: 1 }
      ],
      nextBucketId: 2,
    };
  }, [bucketCapacity, maxGlobalDepth, hashModulo]);

  const [hashState, setHashState] = useState<ExtendibleHashState>(initializeHash);

  // Draw connection lines on canvas
  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set line style
    ctx.strokeStyle = '#5227FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Draw lines for each directory entry to its bucket
    hashState.directory.forEach((entry, index) => {
      const dirElement = document.getElementById(`dir-entry-${index}`);
      const bucketElement = document.getElementById(`bucket-${entry.bucketId}`);

      if (dirElement && bucketElement) {
        const dirRect = dirElement.getBoundingClientRect();
        const bucketRect = bucketElement.getBoundingClientRect();
        const containerRect = rect;

        // Calculate relative positions
        const x1 = dirRect.right - containerRect.left;
        const y1 = dirRect.top + dirRect.height / 2 - containerRect.top;
        const x2 = bucketRect.left - containerRect.left;
        const y2 = bucketRect.top + bucketRect.height / 2 - containerRect.top;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - arrowSize * Math.cos(angle - Math.PI / 6),
          y2 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - arrowSize * Math.cos(angle + Math.PI / 6),
          y2 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#5227FF';
        ctx.fill();
      }
    });
  }, [hashState.directory]);

  // Redraw connections when hash state changes or on resize
  useEffect(() => {
    drawConnections();

    // Redraw on window resize
    const handleResize = () => {
      drawConnections();
    };

    window.addEventListener('resize', handleResize);
    // Small delay to ensure DOM is ready
    const timer = setTimeout(drawConnections, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [drawConnections]);

  // Hash function
  const hashFunction = useCallback((key: number): number => {
    return key % hashModulo;
  }, [hashModulo]);

  // Convert hash to binary string based on global depth
  const getBinaryAddress = useCallback((hash: number, depth: number): string => {
    //longest bits length 
    const hashBitsLength = Math.ceil(Math.log2(hashModulo));
    return hash.toString(2).padStart(hashBitsLength, '0').slice(0,depth);
  }, [hashModulo]);

  // Find bucket for a given key
  const findBucket = useCallback((key: number, state: ExtendibleHashState): Bucket => {
    const hash = hashFunction(key);
    const binaryAddr = getBinaryAddress(hash, state.globalDepth);
    
    console.log(state);
    console.log(`Finding bucket for key ${key} with hash ${hash} and binary address ${binaryAddr}`);
    // Find exact directory entry match
    const directoryEntry = state.directory.find(entry => entry.binaryAddress === binaryAddr);
    if (!directoryEntry) {
      // Fallback to first bucket if no match found
      return state.buckets.get(state.directory[0].bucketId)!;
    }
    
    return state.buckets.get(directoryEntry.bucketId)!;
  }, [hashFunction, getBinaryAddress]);

  // Split bucket when overflow occurs
  const splitBucket = useCallback((bucketId: number, state: ExtendibleHashState): ExtendibleHashState => {
    const bucket = state.buckets.get(bucketId)!;
    
    // Cannot split if we've reached max depth
    if (bucket.localDepth >= state.maxGlobalDepth) {
      return state;
    }

    let newGlobalDepth = state.globalDepth;
    let newDirectory = [...state.directory];

    // If bucket's local depth equals global depth, we need to double the directory
    if (bucket.localDepth === state.globalDepth) {
      newGlobalDepth = state.globalDepth + 1;
      const oldDirectory = [...newDirectory];
      newDirectory = [];

      for (const entry of oldDirectory) {
        newDirectory.push({ ...entry, binaryAddress: entry.binaryAddress + '0' });
        newDirectory.push({ ...entry, binaryAddress: entry.binaryAddress + '1' });
      }
    }

    // Create new bucket
    const newBucket: Bucket = {
      id: state.nextBucketId,
      binaryAddress: bucket.binaryAddress + '1',
      localDepth: bucket.localDepth + 1,
      entries: [],
      maxCapacity: state.bucketCapacity,
    };

    // Update original bucket's local depth
    const updatedBucket: Bucket = {
      ...bucket,
      binaryAddress: bucket.binaryAddress + '0',
      localDepth: bucket.localDepth + 1,
      entries: [],
    };

    // Redistribute entries based on the new local depth bit
    for (const entry of bucket.entries) {
     // add some logs for debugging

     console.log(`Redistributing entry with key ${entry.key}, hash ${entry.hash}`);
     console.log(`Bucket local depth: ${bucket.localDepth}, Updated bucket local depth: ${updatedBucket.localDepth}`);
     console.log(`Binary address: ${getBinaryAddress(entry.hash, updatedBucket.localDepth)}`);
     
     const hash = hashFunction(entry.key);
     const binaryAddr = getBinaryAddress(hash, bucket.localDepth + 1);
     const bitAtLocalDepth = binaryAddr[bucket.localDepth];
      
      if (bitAtLocalDepth === '0') {
        updatedBucket.entries.push(entry);
      } else {
        newBucket.entries.push(entry);
      }
    }

    // Update buckets map
    const newBuckets = new Map();
    for (const [id, bucket] of state.buckets) {
      if (id === bucketId) {
        newBuckets.set(id, updatedBucket);
        newBuckets.set(state.nextBucketId, newBucket);
      } else {
        newBuckets.set(id, bucket);
      }
    }

    // Update directory entries that point to the split bucket
    for (let i = 0; i < newDirectory.length; i++) {
      const entry = newDirectory[i];
      // search for all buckets with the same binaryprefix for all depths starting from global depth down to local depth
        for (let depth = newGlobalDepth; depth >= 1; depth--) {
            const prefix = entry.binaryAddress.slice(0, depth);
            const bucketWithPrefix = Array.from(newBuckets.values()).find(b => b.binaryAddress === prefix);
            if (bucketWithPrefix) {
                newDirectory[i] = { ...entry, bucketId: bucketWithPrefix.id };
            }
        }
    }

    return {
      ...state,
      globalDepth: newGlobalDepth,
      buckets: newBuckets,
      directory: newDirectory,
      nextBucketId: state.nextBucketId + 1,
    };
  }, [hashFunction, getBinaryAddress]);

  // Insert a new key with animated splits
  const insertEntry = useCallback((key: number) => {
    // Get current state to work with
    let currentState = { ...hashState };
    
    // Check if key already exists anywhere in the hash table
    for (const bucket of currentState.buckets.values()) {
      const existingEntryIndex = bucket.entries.findIndex(entry => entry.key === key);
      if (existingEntryIndex !== -1) {
        // Key already exists, no need to insert
        console.log(`Key ${key} already exists in the hash table`);
        return;
      }
    }
    
    const hash = hashFunction(key);
    const hashBitsLength = Math.ceil(Math.log2(hashModulo));
    const binaryHash = hash.toString(2).padStart(hashBitsLength, '0');

    // Add new entry
    const newEntry: HashEntry = { key, hash, binaryHash };
    
    // Process splits with animation delays
    const processSplitsAndInsert = (iteration: number = 0) => {
      const maxIterations = 10;
      
      if (iteration >= maxIterations) {
        console.error(`Maximum iterations reached while trying to insert key ${key}. Insertion may have failed.`);
        return;
      }
      
      // Get fresh state
      setHashState(prevState => {
        let workingState = { ...prevState };
        const targetBucket = findBucket(key, workingState);
        
        console.log(`Iteration ${iteration + 1}: Attempting to insert key ${key} into bucket ${targetBucket.id}`);
        console.log(`Bucket ${targetBucket.id} has ${targetBucket.entries.length}/${targetBucket.maxCapacity} entries.`);
        
        // Check if bucket has space
        if (targetBucket.entries.length < targetBucket.maxCapacity) {
          console.log(`Inserting key ${key} into bucket ${targetBucket.id}`);
          // We can insert here
          const updatedBucket = {
            ...targetBucket,
            entries: [...targetBucket.entries, newEntry],
          };
          
          const newBuckets = new Map(workingState.buckets);
          newBuckets.set(targetBucket.id, updatedBucket);
          
          return { ...workingState, buckets: newBuckets };
        } else {
          // Need to split bucket - check if we can split
          if (targetBucket.localDepth >= workingState.maxGlobalDepth) {
            // Cannot split anymore
            alert(`Warning: Bucket ${targetBucket.id} is full and cannot be split further. We won't insert key ${key} unless you increase the bucket capacity or max global depth.`);
            return workingState;
          } else {
            // Start split animation
            setAnimatingBucket(targetBucket.id);
            console.log(`Splitting bucket ${targetBucket.id}, iteration ${iteration + 1}`);
            
            // Perform the split
            const newState = splitBucket(targetBucket.id, workingState);
            
            // Highlight the newly created bucket
            setNewlyCreatedBucket(workingState.nextBucketId);
            
            // Schedule next iteration after animation
            setTimeout(() => {
              setAnimatingBucket(null);
              setNewlyCreatedBucket(null);
              // Continue with next iteration after a brief pause
              setTimeout(() => {
                processSplitsAndInsert(iteration + 1);
              }, 100);
            }, 1000);
            
            return newState;
          }
        }
      });
    };
    
    // Start the process
    processSplitsAndInsert(0);
  }, [hashState, findBucket, splitBucket, hashFunction, hashModulo]);

  // Check if hash already exists in the hash table
  const checkHashCollision = useCallback((hash: number): {count: number, keys: number[], shouldPrevent: boolean, message: string} | null => {
    const collidingEntries: number[] = [];
    
    // Collect all entries with the same hash from all buckets
    for (const bucket of hashState.buckets.values()) {
      for (const entry of bucket.entries) {
        if (entry.hash === hash) {
          collidingEntries.push(entry.key);
        }
      }
    }
    
    if (collidingEntries.length === 0) {
      return null;
    }
    
    const shouldPrevent = collidingEntries.length >= bucketCapacity;
    let message;
    
    if (shouldPrevent) {
      message = `Cannot insert! Hash collision limit exceeded. ${collidingEntries.length} keys (${collidingEntries.join(', ')}) already produce hash ${hash}, which meets/exceeds bucket capacity (${bucketCapacity})`;
    } else {
      message = `Hash collision detected! Key(s) ${collidingEntries.join(', ')} already produce hash ${hash} (${collidingEntries.length}/${bucketCapacity} capacity used)`;
    }
    
    return {
      count: collidingEntries.length,
      keys: collidingEntries,
      shouldPrevent,
      message
    };
  }, [hashState.buckets, bucketCapacity]);

  // Update hash preview when key changes
  const updateHashPreview = useCallback((keyStr: string) => {
    const key = parseInt(keyStr);
    if (isNaN(key) || key < 0) {
      setHashPreview(null);
      setCollisionMessage(null);
      return;
    }
    
    const hash = hashFunction(key);
    const hashBitsLength = Math.ceil(Math.log2(hashModulo));
    const binary = hash.toString(2).padStart(hashBitsLength, '0');
    
    // Format binary with spaces for better readability
    const formattedBinary = binary;
    
    setHashPreview({ hash, binary: formattedBinary });
    
    // Check for collision
    const collision = checkHashCollision(hash);
    setCollisionMessage(collision?.message || null);
  }, [hashFunction, hashModulo, checkHashCollision]);

  // Handle key input change with validation
  const handleKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    // Allow empty string or valid non-negative numbers
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setNewKey(value);
      updateHashPreview(value);
    }
  }, [updateHashPreview]);

  // Handle form submission
  const handleInsert = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const key = parseInt(newKey);
    if (isNaN(key) || key < 0) return;
    
    // Check if collision would exceed capacity
    const hash = hashFunction(key);
    const collision = checkHashCollision(hash);
    if (collision?.shouldPrevent) {
      // Don't proceed with insertion if collision count exceeds capacity
      return;
    }
    
    insertEntry(key);
    setNewKey('');
    setHashPreview(null);
    setCollisionMessage(null);
  }, [newKey, insertEntry, hashFunction, checkHashCollision]);

  // Reset hash structure
  const handleReset = useCallback(() => {
    setHashState(initializeHash());
    setAnimatingBucket(null);
    setNewlyCreatedBucket(null);
    setNewKey('');
    setHashPreview(null);
    setCollisionMessage(null);
  }, [initializeHash]);

  // Apply configuration changes
  const handleConfigChange = useCallback(() => {
    setHashState(initializeHash());
    setAnimatingBucket(null);
    setNewlyCreatedBucket(null);
    setNewKey('');
    setHashPreview(null);
    setCollisionMessage(null);
  }, [initializeHash]);

  return (
    <div className="extendible-hash-container">
      
      {/* Configuration Panel */}
      <div className="config-panel">
        <div className="config-group">
          <label>
            Hash Modulo:
            <input
              type="number"
              min="2"
              max="32"
              value={hashModulo}
              onChange={(e) => setHashModulo(parseInt(e.target.value) || 2)}
              onBlur={handleConfigChange}
            />
          </label>
          
          <label>
            Max Global Depth:
            <input
              type="number"
              min="1"
              max="8"
              value={maxGlobalDepth}
              onChange={(e) => setMaxGlobalDepth(parseInt(e.target.value) || 1)}
              onBlur={handleConfigChange}
            />
          </label>
          
          <label>
            Bucket Capacity:
            <input
              type="number"
              min="1"
              max="10"
              value={bucketCapacity}
              onChange={(e) => setBucketCapacity(parseInt(e.target.value) || 1)}
              onBlur={handleConfigChange}
            />
          </label>

        <button onClick={handleReset} className="reset-btn">Reset Hash Table</button>
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="info-panel">
        <h3>Current Configuration</h3>
        <div className="info-grid">
          <div>Hash Function: key % {hashModulo}</div>
          <div>Global Depth: {hashState.globalDepth}</div>
          <div>Max Global Depth: {maxGlobalDepth}</div>
          <div>Bucket Capacity: {bucketCapacity}</div>
          <div>Total Buckets: {hashState.buckets.size}</div>
          <div>Directory Size: {hashState.directory.length}</div>
        </div>
      </div>

      

      {/* Hash Structure Visualization */}
      <div className="visualization-container" ref={containerRef}>
        <canvas 
          ref={canvasRef}
          className="connection-canvas"
        />
        {/* Directory */}
        <div className="directory-section">
          <h3>Directory (Global Depth: {hashState.globalDepth})</h3>
          <div className="directory">
            {hashState.directory.map((entry, index) => (
              <div 
                key={index}
                id={`dir-entry-${index}`}
                className="directory-entry"
                data-bucket-id={entry.bucketId}
              >
                <span className="binary-addr">{entry.binaryAddress || '∅'}</span>
                <span className="arrow">→</span>
                <span className="bucket-ref">Bucket {entry.bucketId}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buckets */}
        <div className="buckets-section">
          <h3>Buckets</h3>
          <div className="buckets-container">
            {Array.from(hashState.buckets.values()).map((bucket) => (
              <div
                key={bucket.id}
                id={`bucket-${bucket.id}`}
                className={`bucket ${animatingBucket === bucket.id ? 'splitting' : ''} ${newlyCreatedBucket === bucket.id ? 'newly-created' : ''}`}
              >
                <div className="bucket-header">
                  <span className="bucket-id">Bucket {bucket.id}</span>
                  <span 
                    className="local-depth" 
                    title="Local Depth: Number of bits this bucket uses from the hash value for addressing"
                  >
                    Depth: {bucket.localDepth}
                  </span>
                </div>
                <div className="bucket-entries">
                  {bucket.entries.map((entry, index) => (
                    <div key={index} className="entry">
                      <span className="key">{entry.key}</span>
                      <span className="hash-info">({entry.hash} → {entry.binaryHash})</span>
                    </div>
                  ))}
                  {/* Show empty slots */}
                  {Array.from({ length: bucket.maxCapacity - bucket.entries.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="entry empty">
                      <span>—</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


            {/* Insert Panel */}
      <div className="insert-panel">
        <form onSubmit={handleInsert}>
          <div className="input-container">
            <input
              type="number"
              placeholder="Enter key (any positive integer)"
              value={newKey}
              onChange={handleKeyChange}
              min="0"
              required
            />
            {hashPreview && (
              <div className="hash-preview">
                <div className="hash-value">
                  <span className="label">Hash Value, h(k) = </span>
                  <span className="value">{hashPreview.hash}</span>
                </div>
                <div className="binary-form">
                  <span className="label">Binary form of h(k) = </span>
                  <span className="binary">{hashPreview.binary}</span>
                </div>
                {collisionMessage && (
                  <div className="collision-message">
                    <span className="collision-text">{collisionMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={!newKey || !hashPreview || (collisionMessage?.includes('Cannot insert!'))}
          >
            Insert Key
          </button>
        </form>

      </div>
            
    </div>
  );
};

export default ExtendibleHashVisualization;
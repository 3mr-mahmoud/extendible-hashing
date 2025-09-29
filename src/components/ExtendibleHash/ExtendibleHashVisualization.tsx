import React, { useState, useCallback } from 'react';
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
  const [hashModulo, setHashModulo] = useState(97);
  const [maxGlobalDepth, setMaxGlobalDepth] = useState(4);
  const [bucketCapacity, setBucketCapacity] = useState(3);
  const [newKey, setNewKey] = useState<string>('');
  const [animatingBucket, setAnimatingBucket] = useState<number | null>(null);

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

  // Hash function
  const hashFunction = useCallback((key: number): number => {
    return key % hashModulo;
  }, [hashModulo]);

  // Convert hash to binary string based on global depth
  const getBinaryAddress = useCallback((hash: number, depth: number): string => {
    return hash.toString(2).slice(-depth).padStart(depth, '0');
  }, []);

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
      binaryAddress: '1' + bucket.binaryAddress,
      localDepth: bucket.localDepth + 1,
      entries: [],
      maxCapacity: state.bucketCapacity,
    };

    // Update original bucket's local depth
    const updatedBucket: Bucket = {
      ...bucket,
      binaryAddress: '0' + bucket.binaryAddress,
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
     const bitAtLocalDepth = binaryAddr[0];
      
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
            const prefix = entry.binaryAddress.slice(-depth);
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

  // Insert a new key
  const insertEntry = useCallback((key: number) => {
    setHashState(prevState => {
      let currentState = { ...prevState };
      const bucket = findBucket(key, currentState);

      // Check if key already exists
      const existingEntryIndex = bucket.entries.findIndex(entry => entry.key === key);
      if (existingEntryIndex !== -1) {
        // Key already exists, no need to insert
        return currentState;
      }

      const hash = hashFunction(key);
      const binaryHash = hash.toString(2);
      
      // Add new entry
      const newEntry: HashEntry = { key, hash, binaryHash };
      
      // Check if bucket has space
      if (bucket.entries.length < bucket.maxCapacity) {
        const updatedBucket = {
          ...bucket,
          entries: [...bucket.entries, newEntry],
        };
        
        const newBuckets = new Map(currentState.buckets);
        newBuckets.set(bucket.id, updatedBucket);
        
        return { ...currentState, buckets: newBuckets };
      } else {
        // Need to split bucket
        setAnimatingBucket(bucket.id);
        setTimeout(() => setAnimatingBucket(null), 1000);
        
        // First split the bucket
        currentState = splitBucket(bucket.id, currentState);
        
        // Then insert into appropriate bucket
        const targetBucket = findBucket(key, currentState);
        const updatedTargetBucket = {
          ...targetBucket,
          entries: [...targetBucket.entries, newEntry],
        };
        
        const newBuckets = new Map(currentState.buckets);
        newBuckets.set(targetBucket.id, updatedTargetBucket);
        
        return { ...currentState, buckets: newBuckets };
      }
    });
  }, [findBucket, splitBucket, hashFunction, getBinaryAddress]);

  // Handle form submission
  const handleInsert = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const key = parseInt(newKey);
    if (isNaN(key)) return;
    
    insertEntry(key);
    setNewKey('');
  }, [newKey, insertEntry]);

  // Reset hash structure
  const handleReset = useCallback(() => {
    setHashState(initializeHash());
    setAnimatingBucket(null);
  }, [initializeHash]);

  // Apply configuration changes
  const handleConfigChange = useCallback(() => {
    setHashState(initializeHash());
    setAnimatingBucket(null);
  }, [initializeHash]);

  return (
    <div className="extendible-hash-container">
      <h1>Extendible Hashing Visualization</h1>
      
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
            Max Global Depth (k):
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
            Bucket Capacity (r):
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

      {/* Insert Panel */}
      <div className="insert-panel">
        <form onSubmit={handleInsert}>
          <input
            type="number"
            placeholder="Enter key to insert"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            required
          />
          <button type="submit">Insert Key</button>
        </form>

      </div>

      {/* Hash Structure Visualization */}
      <div className="visualization-container">
        {/* Directory */}
        <div className="directory-section">
          <h3>Directory (Global Depth: {hashState.globalDepth})</h3>
          <div className="directory">
            {hashState.directory.map((entry, index) => (
              <div key={index} className="directory-entry">
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
                className={`bucket ${animatingBucket === bucket.id ? 'splitting' : ''}`}
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
    </div>
  );
};

export default ExtendibleHashVisualization;
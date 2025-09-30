# 🗂️ Extendible Hashing Visualization

An interactive, educational visualization of the **Extendible Hashing** algorithm used in Database Management Systems (DBMS). Built with modern web technologies including Astro, React, and TypeScript for optimal performance and learning experience.

[![Extendible Hashing Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?style=for-the-badge)](https://3mr-mahmoud.github.io/extendible-hashing/)
![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?style=for-the-badge&logo=astro)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## 🎯 Features

- 🔧 **Interactive Configuration**: Real-time parameter adjustment
- 📊 **Live Visualization**: Dynamic hash table structure display  
- ✨ **Animated Splits**: Smooth bucket splitting animations with visual effects
- 🌙 **Dark Theme**: Professional UI optimized for extended viewing
- 📚 **Educational Tooltips**: Contextual explanations for learning
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🎨 **Liquid Background**: Beautiful interactive fluid simulation

## 🧮 Algorithm Parameters

Configure the extendible hashing behavior with three key parameters:

### Hash Function Modulo
- **Range**: 2-32
- **Function**: `key % modulo`
- **Impact**: Controls key distribution across the hash space

### Maximum Global Depth (k)
- **Range**: 1-8 levels  
- **Purpose**: Limits directory expansion depth
- **Behavior**: Prevents infinite splitting at maximum depth

### Bucket Capacity (r)
- **Range**: 1-10 entries per bucket
- **Effect**: Determines when bucket splits occur
- **Trade-off**: Lower capacity = more splits but better distribution

## 🎮 How to Use

1. **Configure Parameters**: Adjust hash modulo, max depth, and bucket capacity
2. **Insert Keys**: Enter numeric keys and watch the algorithm work
3. **Observe Splits**: See animated bucket splitting when capacity is exceeded
4. **Learn Patterns**: Notice how binary representations determine bucket placement
5. **Reset**: Use the reset button to start over with new configurations

## 🔍 Visual Elements

### Directory Structure
- Shows global depth and binary addresses
- Arrows indicate bucket mappings
- Updates dynamically during splits

### Bucket Display  
- **Bucket ID**: Unique identifier for each bucket
- **Local Depth (LD)**: Hover for tooltip explanation
- **Entries**: Shows key and binary hash representation
- **Animation**: Splitting buckets glow and pulse during operations

### Real-time Information
- Current configuration summary
- Total buckets and directory size
- Hash function visualization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/3mr-mahmoud/extendible-hashing
cd extendible-hashing

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 📁 Project Structure

```text
hash/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ExtendibleHash/
│   │   │   ├── ExtendibleHashVisualization.tsx    # Main React component
│   │   │   └── ExtendibleHash.css                 # Component styles
│   │   └── LiquidEther/
│   │       └── LiquidEther.jsx                    # Fluid animation component
│   ├── layouts/
│   │   └── Layout.astro                           # Base HTML layout
│   └── pages/
│       └── index.astro                            # Main page
├── package.json
├── astro.config.mjs                               # Astro configuration
├── tsconfig.json                                  # TypeScript configuration
└── README.md
```

## 🧠 Algorithm Understanding

### Extendible Hashing Concepts

**Global Depth**: The maximum number of bits used by the directory for addressing buckets.

**Local Depth**: The number of bits a specific bucket uses from the hash value.

**Directory**: A lookup table that maps hash addresses to bucket pointers.

**Splitting**: When a bucket overflows, it splits into two buckets, potentially doubling the directory size.

### Key Algorithm Steps

1. **Hash the key** using the modulo function
2. **Convert to binary** representation 
3. **Use rightmost bits** (based on global depth) to find directory entry
4. **Locate target bucket** through directory lookup
5. **Insert or split** based on bucket capacity

## 🎨 Design Features

- **Modern Dark UI**: Easy on the eyes with professional color scheme
- **Smooth Animations**: Enhanced learning through visual feedback
- **Responsive Layout**: Adapts to different screen sizes
- **Interactive Background**: Engaging liquid simulation footer
- **Educational Focus**: Tooltips and clear labeling for learning

## 🛠️ Technologies Used

- **[Astro](https://astro.build/)**: Modern static site generator
- **[React](https://reactjs.org/)**: UI component library  
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **CSS3**: Custom animations and responsive design
- **Three.js**: 3D graphics for fluid simulation

## 📖 Educational Value

This visualization is designed for:

- **Computer Science Students** learning DBMS concepts
- **Database Professionals** explaining hashing algorithms
- **Educators** teaching data structures and algorithms
- **Self-learners** exploring database internals

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines
- Follow existing code style and structure
- Add comments for complex algorithm logic
- Test thoroughly before submitting
- Update documentation as needed

## 📄 License

This project is created for educational purposes.

## 👨‍💻 Credits

**Designed and developed with ❤️ by Amr Mahmoud**

© Copyrights reserved by Faculty of Engineering - Cairo University

---

## 📚 References

- [GeeksforGeeks - Extendible Hashing](https://www.geeksforgeeks.org/dbms/extendible-hashing-dynamic-approach-to-dbms/)

---

*Happy Learning! 🎓*
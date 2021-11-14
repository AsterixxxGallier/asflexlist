// declare function log(message: string): void

// @unmanaged
// class BinaryFlexStructure {
// }
//
// @unmanaged
// class ChunkChunk {
//
// }
//
// @unmanaged
// class LocalLinkIndex {
//     nodeIndex: u8
//     degree: u8
//
//     constructor(nodeIndex: u8, degree: u8) {
//         this.nodeIndex = nodeIndex
//         this.degree = degree
//     }
//
//     toString(): string {
//         return `[node ${this.nodeIndex.toString(2)} degree ${this.degree}]`
//     }
// }
//
// @unmanaged
// export class Chunk<E, D extends number> {
//     static indexBits: u8 = 8
//     static maxSize: i32 = 1 << Chunk.indexBits
//     static lastIndex: i64 = Chunk.maxSize - 1
//     static offsetBitMask: i32 = ~0 << Chunk.indexBits
//     static indexBitMask: i32 = ~Chunk.offsetBitMask
//     static numbersOfLinks: StaticArray<u8> = new StaticArray<u8>(Chunk.maxSize)
//     static linkIndexesAbove: StaticArray<StaticArray<LocalLinkIndex>> =
//         new StaticArray<StaticArray<LocalLinkIndex>>(Chunk.maxSize)
//     offset: i32
//     elements: StaticArray<E> = new StaticArray<E>(Chunk.maxSize)
//     linkLengths: StaticArray<StaticArray<D>> = new StaticArray<StaticArray<D>>(Chunk.maxSize)
//     size: u16 = 0
//     totalLength: D = 0 as D
//
//     constructor(offset: i32) {
//         this.offset = offset
//         for (let i = 0; i < this.linkLengths.length; i++) {
//             this.linkLengths[i] = new StaticArray()
//         }
//     }
//
//     @inline
//     get lastIndex(): u8 {
//         return this.size - 1
//     }
//
//     @inline
//     static calculateLinkIndexesAbove(localIndex: u8): StaticArray<LocalLinkIndex> {
//         const linkIndexes = new StaticArray<LocalLinkIndex>(this.indexBits as i32)
//         let index = localIndex
//         for (let degree = 0 as u8; degree < this.indexBits; degree++) {
//             log("hello world")
//             // log(`${degree}: ${index}`)
//             if (index >= 1 << degree)
//                 index -= 1 << degree
//             // log(`=> ${index}`)
//             linkIndexes[degree] = new LocalLinkIndex(index & (~0 << degree), degree)
//         }
//         return linkIndexes
//     }
//
//     @inline
//     static calculateNumberOfLinks(index: u8): u8 {
//         const trailingZeros = ctz(index)
//         const ones = popcnt(index)
//         return (Chunk.indexBits - trailingZeros) > (ones as u8) ? trailingZeros + 1 : trailingZeros
//     }
//
//     static init(): void {
//         for (let i = 0; i < Chunk.maxSize; i++) {
//             this.numbersOfLinks[i] = this.calculateNumberOfLinks(i as u8)
//             this.linkIndexesAbove[i] = this.calculateLinkIndexesAbove(i as u8)
//         }
//     }
//
//     appendUnchecked(element: E, distanceFromEnd: D): void {
//         const linkIndexes = Chunk.linkIndexesAbove[this.size]
//         for (let i = 0; i < linkIndexes.length; i++) {
//             const linkIndex = linkIndexes[i]
//             this.setLinkLengthUnchecked(linkIndex, (this.getLinkLengthUnchecked(linkIndex) + distanceFromEnd) as D)
//         }
//         this.elements[this.size] = element
//         this.size++
//         this.totalLength = (this.totalLength + distanceFromEnd) as D
//     }
//
//     @inline
//     getLinkLengthUnchecked(localIndex: LocalLinkIndex): D {
//         return this.getLinkLengthLocalUnchecked(localIndex.nodeIndex, localIndex.degree)
//     }
//
//     @inline
//     setLinkLengthUnchecked(localIndex: LocalLinkIndex, value: D): void {
//         this.setLinkLengthLocalUnchecked(localIndex.nodeIndex, localIndex.degree, value)
//     }
//
//     @inline
//     /**
//      * Converts `globalIndex` to a local index by stripping all offset bits
//      * @param globalIndex
//      */
//     toLocalIndex(globalIndex: i32): u8 {
//         return globalIndex & Chunk.indexBitMask
//     }
//
//     @inline
//     /**
//      * Converts `localIndex` to a global index by adding {@link this.offset}
//      * @param localIndex
//      */
//     toGlobalIndex(localIndex: u8): i32 {
//         return this.offset + localIndex
//     }
//
//     @inline
//     /**
//      * Gets the length of the link starting at `index` of degree `degree`
//      * @param index the local index of node a
//      * @param degree the degree of the link
//      */
//     getLinkLengthLocalUnchecked(index: i32, degree: i32): D {
//         return this.linkLengths[index][degree]
//     }
//
//     @inline
//     /**
//      * Sets the length of the link starting at `index` of degree `degree` to `length`
//      * @param index the local index of node a
//      * @param degree the degree of the link
//      * @param length the new length of the link
//      */
//     setLinkLengthLocalUnchecked(index: i32, degree: i32, length: D): void {
//         this.linkLengths[index][degree] = length
//     }
//
//     /*@inline
//     /!**
//      * This method directly gets the link from `aIndex` to `bIndex` via {@link getLinkLengthAtLocalUnchecked},
//      * if it exists. If it doesn't, this method either returns an incorrect value or throws an exception.
//      * @param aIndex the local index of node a
//      * @param bIndex the local index of node b
//      *!/
//     getLinkLengthFromToLocalUnchecked(aIndex: i32, bIndex: i32): D {
//         return this.getLinkLengthAtLocalUnchecked(aIndex, ctz(bIndex))
//     }
//
//     @inline
//     /!**
//      * Check that there is a link from `aIndex` to `bIndex` by asserting that exactly one bit in `aIndex` is different
//      * from the same bit in `bIndex`, then call {@link getLinkLengthFromToLocalUnchecked}
//      * @param aIndex
//      * @param bIndex
//      *!/
//     getLinkLengthFromToLocal(aIndex: i32, bIndex: i32): D {
//         assert(popcnt(aIndex ^ bIndex) == 1)
//         return this.getLinkLengthFromToLocalUnchecked(aIndex, bIndex)
//     }*/
//
//     printDebug(): string {
//         let result = ""
//         const maxNumberOfLinksFromNode = Chunk.indexBits
//         const linkLengthPadWidth = 4
//         for (let nodeIndex = 0; nodeIndex < Chunk.maxSize; nodeIndex++) {
//             let line = ""
//             const linkLengths = this.linkLengths[nodeIndex]
//             for (let linkDegree = maxNumberOfLinksFromNode - 1; linkDegree >= 0; linkDegree--) {
//                 if (linkDegree >= linkLengths.length) {
//                     line += " ".repeat(linkLengthPadWidth)
//                 } else {
//                     const linkLength = linkLengths[linkDegree]
//                     line += linkLength.toString().padStart(linkLengthPadWidth)
//                 }
//                 line += " "
//             }
//             line += nodeIndex.toString().padStart(i32(Mathf.log10(Chunk.lastIndex)))
//             line += " "
//             line += nodeIndex.toString(2).padStart(Chunk.indexBits, '0')
//             line += " "
//             if (nodeIndex >= this.size) {
//                 line += "/"
//             } else {
//                 const element = this.elements[nodeIndex]
//                 // @ts-ignore
//                 if (isDefined(element.toString)) {
//                     // @ts-ignore
//                     line += element.toString()
//                 } else {
//                     line += "[no string representation available]"
//                 }
//             }
//             result += line
//         }
//         return result
//     }
// }
//
// Chunk.init()

/*
// @unmanaged
// class BinaryFlexChunk {
//     static bits = 4
//     static height = BinaryFlexChunk.bits + 1
//     static maxNodes = 1 << BinaryFlexChunk.bits
//     static lastNodeIndex = BinaryFlexChunk.maxNodes - 1
//     static lastLinkLengthIndex = BinaryFlexChunk.lastNodeIndex << 1
//     static linkLengths = BinaryFlexChunk.lastLinkLengthIndex | 1
//     static degreePrefixes = new Int32Array(BinaryFlexChunk.height)
//     static initialiseDegreePrefixes() {
//         for (let degree = 0; degree < this.degreePrefixes.length; degree++) {
//             this.degreePrefixes[degree] = (~0 << (BinaryFlexChunk.height - degree)) ^ (~0 << BinaryFlexChunk.height)
//         }
//     }
//
//     data = new StaticArray<NodeData>(BinaryFlexChunk.maxNodes)
//     nodes = 0
//     linkLengths = new Float64Array(BinaryFlexChunk.linkLengths)
//
//     append(data: NodeData, distance: f64, startIndex: i32) {
//         if (this.nodes == BinaryFlexChunk.maxNodes) ERROR() // TODO
//         this.data[this.nodes] = data
//
//     }
//
//     @inline
//     linkLength(index: i32, degree: i32): f64 {
//         return this.linkLengths[this.linkIndex(index, degree)]
//     }
//
//     @inline
//     linkIndex(nodeIndex: i32, degree: i32): i32 {
//         return unchecked(BinaryFlexChunk.degreePrefixes[degree]) | nodeIndex >>> degree
//     }
//
//     traverse(distance: f64, startIndex: i32 = 0): TraversalResult {
//         let toGo = distance
//         let index: i32 = startIndex
//         for (let degree = startIndex ? ctz(startIndex) : BinaryFlexChunk.bits; degree >= 0; degree--) {
//             const toNext = this.linkLength(index, degree)
//             if (toGo >= toNext) {
//                 toGo -= toNext
//                 index += 1 << degree
//             } else break
//         }
//         return new TraversalResult(index, toGo)
//     }
// }
// BinaryFlexChunk.initialiseDegreePrefixes()
//
// class TraversalResult {
//     index: i32
//     distance: f64
//
//     constructor(index: i32, distance: f64) {
//         this.index = index
//         this.distance = distance
//     }
// }
//
// @unmanaged
// class NodeData {
//     id: u16
//
//     constructor(id: u16) {
//         this.id = id
//     }
// }
//
// /!*
// @unmanaged
// class BinaryFlexChunk {
//     static indexBitSize = 8
//     static bitCount = 4
//     static size = 1 << BinaryFlexChunk.bitCount
//
//     nodes = new StaticArray<BinaryFlexNode>(BinaryFlexChunk.size)
//
//     index(distance: f64): u8 {
//         let distanceLeft = distance
//         let index: u8 = 0
//         let height: u8 = BinaryFlexChunk.bitCount
//         while (true) {
//             let distanceToNext = this.nodes[index].distances[--height]
//             if (distanceLeft > distanceToNext) {
//                 index += 1 << height
//             } else {
//                 return index
//             }
//         }
//     }
// }
//
// @unmanaged
// class BinaryFlexNode {
//     /!**
//      * TODO add actual data
//      *!/
//     id: u32
//     distances: Float64Array
//
//     constructor(id: u32, distances: Float64Array) {
//         this.id = id;
//         this.distances = distances;
//     }
// }*!/
*/

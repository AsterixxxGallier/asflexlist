declare function log(message: string): void

export function init(): void {
    Chunk.init()
    const chunk = new DataChunk<string, u32>(0)
    chunk.appendUnchecked("a", 4)
    chunk.appendUnchecked("b", 2)
    chunk.appendUnchecked("c", 3)
    chunk.appendUnchecked("d", 1)
    chunk.appendUnchecked("e", 2)
    log(chunk.printDebug())
    log(chunk.traverse(7).toString())
}

class LinkIndex {
    nodeIndex: u8
    degree: u8

    constructor(nodeIndex: u8, degree: u8) {
        this.nodeIndex = nodeIndex
        this.degree = degree
    }

    toString(): string {
        return `[node ${this.nodeIndex.toString(2).padStart(Chunk.indexBits, '0')} degree ${this.degree}]`
    }
}

class TraversalResult<D extends number> {
    index: i32
    /**
     * The distance that was already traversed from this node; always smaller than the full distance to the next node in this {@link Chunk}
     */
    distance: D

    constructor(index: i32, distance: D) {
        this.index = index
        this.distance = distance
    }

    toString(): string {
        return `[traversal result: node ${this.index.toString(2).padStart(Chunk.indexBits, '0')} distance ${this.distance}]`
    }
}

abstract class Chunk<E, D extends number> {
    static indexBits: i32 = 8
    static maxSize: i32 = 1 << Chunk.indexBits
    static lastIndex: i64 = Chunk.maxSize - 1
    static offsetBitMask: i32 = ~0 << Chunk.indexBits
    static indexBitMask: i32 = ~Chunk.offsetBitMask
    static numbersOfLinks: StaticArray<u8> = new StaticArray<u8>(Chunk.maxSize)
    static linkIndexesAbove: StaticArray<Array<LinkIndex>> =
        new StaticArray<Array<LinkIndex>>(Chunk.maxSize)

    @inline
    static calculateLinkIndexesAbove(localIndex: u8): Array<LinkIndex> {
        if (localIndex == 0) return new Array<LinkIndex>(0)
        const linkIndexes = new Array<LinkIndex>(this.indexBits as i32)
        let index = localIndex
        for (let degree = 0 as u8; degree < (this.indexBits as u8); degree++) {
            if ((localIndex as i32) + (1 << degree) > this.maxSize) {
                linkIndexes.length = degree
                return linkIndexes
            }
            if (degree == 0) index--
            linkIndexes[degree] = new LinkIndex(index, degree)
            index = index & ~(1 << degree)
        }
        return linkIndexes
    }

    @inline
    static calculateNumberOfLinks(index: u8): u8 {
        const trailingZeros = ctz(index)
        const ones = popcnt(index)
        return Chunk.indexBits - trailingZeros > (ones as i32) ? trailingZeros + 1 : trailingZeros
    }

    static init(): void {
        for (let i = 0; i < Chunk.maxSize; i++) {
            this.numbersOfLinks[i] = this.calculateNumberOfLinks(i as u8)
            this.linkIndexesAbove[i] = this.calculateLinkIndexesAbove(i as u8)
        }
    }

    displacement: D
    elements: StaticArray<E> = new StaticArray<E>(Chunk.maxSize)
    linkLengths: StaticArray<StaticArray<D>> = new StaticArray<StaticArray<D>>(Chunk.maxSize)
    size: i32 = 0
    totalLength: D

    // @ts-ignore
    constructor(displacement: D = 0) {
        this.displacement = displacement
        this.totalLength = displacement
        for (let i = 0; i < this.linkLengths.length; i++) {
            this.linkLengths[i] = new StaticArray(Chunk.numbersOfLinks[i])
        }
    }

    @inline
    get lastIndex(): u8 {
        return this.size - 1
    }

    appendUnchecked(element: E, distanceFromEnd: D): void {
        if (this.size == 0) {
            this.elements[0] = element
            // @ts-ignore
            this.displacement += distanceFromEnd
            // @ts-ignore
            this.totalLength += distanceFromEnd
            this.size++
            return
        }
        const linkIndexes = Chunk.linkIndexesAbove[this.size]
        for (let i = 0; i < linkIndexes.length; i++) {
            const linkIndex = linkIndexes[i]
            // @ts-ignore
            this.setLinkLengthWithLinkIndexUnchecked(linkIndex, this.getLinkLengthWithLinkIndexUnchecked(linkIndex) + distanceFromEnd)
        }
        this.elements[this.size] = element
        this.size++
        // @ts-ignore
        this.totalLength += distanceFromEnd
    }

    traverse(distanceFromStart: D): TraversalResult<D> {
        if (distanceFromStart < this.displacement) {
            return new TraversalResult(-1, distanceFromStart)
        }
        let toGo = distanceFromStart - this.displacement
        let index: i32 = 0
        for (let degree = Chunk.indexBits - 1; degree >= 0; degree--) {
            const toNext = this.getLinkLengthUnchecked(index, degree as u8)
            if (toGo >= toNext) {
                // @ts-ignore
                toGo -= toNext
                index += 1 << degree
            }
        }
        // @ts-ignore
        return new TraversalResult(index, toGo)
    }

    @inline
    getLinkLengthWithLinkIndexUnchecked(linkIndex: LinkIndex): D {
        return this.getLinkLengthUnchecked(linkIndex.nodeIndex, linkIndex.degree)
    }

    @inline
    setLinkLengthWithLinkIndexUnchecked(linkIndex: LinkIndex, value: D): void {
        this.setLinkLengthUnchecked(linkIndex.nodeIndex, linkIndex.degree, value)
    }

    @inline
    /**
     * Gets the length of the link starting at `index` of degree `degree`
     * @param index the local index of node a
     * @param degree the degree of the link
     */
    getLinkLengthUnchecked(index: i32, degree: u8): D {
        return this.linkLengths[index][degree]
    }

    @inline
    /**
     * Sets the length of the link starting at `index` of degree `degree` to `length`
     * @param index the local index of node a
     * @param degree the degree of the link
     * @param length the new length of the link
     */
    setLinkLengthUnchecked(index: i32, degree: u8, length: D): void {
        this.linkLengths[index][degree] = length
    }

    // @inline
    // /**
    //  * Gets the length of the link starting at `index` of degree `degree`, while doing range checks
    //  * @param index the local index of node a
    //  * @param degree the degree of the link
    //  */
    // getLinkLength(index: i32, degree: u8): D {
    //     if (index < 0 || index >= this.size) {
    //         throw new Error(`Chunk index ${index} out of range: \n${this.printDebug()}`)
    //     }
    //     if (degree < 0 || degree >= Chunk.numbersOfLinks[index]) {
    //         throw new Error(`Chunk degree ${degree} at index ${index} out of range: \n${this.printDebug()}`)
    //     }
    //     return this.linkLengths[index][degree]
    // }

    printDebug(): string {
        let result = "\n"
        const maxNumberOfLinksFromNode = Chunk.indexBits
        const linkLengthPadWidth = 2
        result += `displacement: ${this.displacement}`.padStart(maxNumberOfLinksFromNode * (linkLengthPadWidth + 1) - 1)
        result += "\n"
        for (let nodeIndex = 0; nodeIndex < Chunk.maxSize; nodeIndex++) {
            let line = ""
            const linkLengths = this.linkLengths[nodeIndex]
            for (let linkDegree = maxNumberOfLinksFromNode - 1 as i32; linkDegree >= 0; linkDegree--) {
                if (linkDegree >= linkLengths.length) {
                    line += " ".repeat(linkLengthPadWidth)
                } else {
                    const linkLength = linkLengths[linkDegree]
                    line += linkLength.toString().padStart(linkLengthPadWidth)
                }
                line += " "
            }
            line += nodeIndex.toString().padStart(i32(Math.ceil(Mathf.log10(Chunk.lastIndex as f32))))
            line += " "
            line += nodeIndex.toString(2).padStart(Chunk.indexBits, '0')
            line += " "
            if (nodeIndex >= this.size) {
                line += "/"
            } else {
                const element = this.elements[nodeIndex]
                // @ts-ignore
                if (isDefined(element.toString)) {
                    // @ts-ignore
                    line += element.toString()
                } else {
                    line += "[no string representation available]"
                }
            }
            result += line
            result += "\n"
        }
        return result
    }
}

class DataChunkChunk<E, D extends number> extends Chunk<DataChunk<E, D>, D> {
    @inline
    get lastChunk(): DataChunk<E, D> {
        return this.elements[this.lastIndex]
    }

    appendElementUnchecked(element: E, distanceFromEnd: D): void {
        const lastChunk = this.lastChunk;
        if (lastChunk.size < Chunk.maxSize) {
            lastChunk.appendUnchecked(element, distanceFromEnd)
        } else {
            this.appendUnchecked(new Chunk())
        }
    }
}

class ChunkChunkChunk<E, D extends number> extends Chunk<Chunk<Chunk<E, D>, D>, D> {
    @inline
    get lastChunk(): Chunk<Chunk<E, D>, D> {
        return this.elements[this.lastIndex]
    }

    appendElementUnchecked(element: E, distanceFromEnd: D): void {
        const lastChunk = this.lastChunk;
        if (lastChunk.size < Chunk.maxSize) {
            lastChunk.appendUnchecked(element, distanceFromEnd)
        } else {
            this.appendUnchecked(new Chunk())
        }
    }
}

class DataChunk<E, D extends number> extends Chunk<E, D> {
    // TODO implement sublists
}
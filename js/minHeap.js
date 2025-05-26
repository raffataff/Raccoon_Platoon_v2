// js/minHeap.js
// complete
class MinHeap {
    constructor() {
        this.heap = []; // Array to store heap elements (PathNode objects)
    }

    // Helper to get parent index
    _getParentIndex(i) {
        return Math.floor((i - 1) / 2);
    }

    // Helper to get left child index
    _getLeftChildIndex(i) {
        return 2 * i + 1;
    }

    // Helper to get right child index
    _getRightChildIndex(i) {
        return 2 * i + 2;
    }

    // Helper to swap two elements in the heap
    _swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    // Heapify up (bubble up) - maintain heap property after insertion
    _heapifyUp(index) {
        let currentIndex = index;
        let parentIndex = this._getParentIndex(currentIndex);

        // Compare with parent and swap if current node's F-cost is smaller
        // Also considers G-cost as a tie-breaker (smaller G-cost is preferred for same F-cost)
        // This can sometimes lead to slightly more "natural" looking paths or faster convergence.
        while (currentIndex > 0 &&
               (this.heap[currentIndex].f < this.heap[parentIndex].f ||
               (this.heap[currentIndex].f === this.heap[parentIndex].f && this.heap[currentIndex].g < this.heap[parentIndex].g))) {
            this._swap(currentIndex, parentIndex);
            currentIndex = parentIndex;
            parentIndex = this._getParentIndex(currentIndex);
        }
    }

    // Heapify down (bubble down) - maintain heap property after extraction
    _heapifyDown(index) {
        let currentIndex = index;
        let leftChildIndex = this._getLeftChildIndex(currentIndex);
        let rightChildIndex = this._getRightChildIndex(currentIndex);
        let smallestChildIndex = currentIndex;

        // Find the smallest among current, left child, and right child
        if (leftChildIndex < this.heap.length &&
            (this.heap[leftChildIndex].f < this.heap[smallestChildIndex].f ||
            (this.heap[leftChildIndex].f === this.heap[smallestChildIndex].f && this.heap[leftChildIndex].g < this.heap[smallestChildIndex].g))) {
            smallestChildIndex = leftChildIndex;
        }

        if (rightChildIndex < this.heap.length &&
            (this.heap[rightChildIndex].f < this.heap[smallestChildIndex].f ||
            (this.heap[rightChildIndex].f === this.heap[smallestChildIndex].f && this.heap[rightChildIndex].g < this.heap[smallestChildIndex].g))) {
            smallestChildIndex = rightChildIndex;
        }

        // If the smallest is not the current node, swap and continue heapifying down
        if (smallestChildIndex !== currentIndex) {
            this._swap(currentIndex, smallestChildIndex);
            this._heapifyDown(smallestChildIndex);
        }
    }

    // Insert a new node into the heap
    insert(node) { // node is expected to be a PathNode object with an 'f' property
        this.heap.push(node);
        this._heapifyUp(this.heap.length - 1);
    }

    // Extract the node with the minimum F-cost (the root)
    extractMin() {
        if (this.isEmpty()) {
            return null;
        }
        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        const minNode = this.heap[0]; // The root is the minimum
        this.heap[0] = this.heap.pop(); // Move the last element to the root
        this._heapifyDown(0); // Restore heap property from the root

        return minNode;
    }

    // Check if the heap is empty
    isEmpty() {
        return this.heap.length === 0;
    }

    // Get the size of the heap
    size() {
        return this.heap.length;
    }

    // Peek at the minimum element without extracting
    peek() {
        return this.isEmpty() ? null : this.heap[0];
    }

    // (Optional) Clear the heap
    clear() {
        this.heap = [];
    }
}
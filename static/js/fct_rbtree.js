export class RedBlackTree {
    constructor(lessThan, equal) {
        this.TNULL = new Item(null, null, "BLACK");
        this.root = this.TNULL;
        this.lessThan = lessThan;
        this.equal = equal;
    }

    leftRotate(x) {
        let y = x.right;
        x.right = y.left;
        if (y.left !== this.TNULL) y.left.parent = x;
        y.parent = x.parent;
        if (x.parent === null) this.root = y;
        else if (x === x.parent.left) x.parent.left = y;
        else x.parent.right = y;
        y.left = x;
        x.parent = y;
    }

    rightRotate(x) {
        let y = x.left;
        x.left = y.right;
        if (y.right !== this.TNULL) y.right.parent = x;
        y.parent = x.parent;
        if (x.parent === null) this.root = y;
        else if (x === x.parent.right) x.parent.right = y;
        else x.parent.left = y;
        y.right = x;
        x.parent = y;
    }

    rbTransplant(u, v) {
        if (u.parent === null) this.root = v;
        else if (u === u.parent.left) u.parent.left = v;
        else u.parent.right = v;
        v.parent = u.parent;
    }

    fixInsert(k) {
        let u;
        while (k.parent.color === "RED") {
            if (k.parent === k.parent.parent.right) {
                u = k.parent.parent.left;
                if (u.color === "RED") {
                    u.color = "BLACK";
                    k.parent.color = "BLACK";
                    k.parent.parent.color = "RED";
                    k = k.parent.parent;
                } else {
                    if (k === k.parent.left) {
                        k = k.parent;
                        this.rightRotate(k);
                    }
                    k.parent.color = "BLACK";
                    k.parent.parent.color = "RED";
                    this.leftRotate(k.parent.parent);
                }
            } else {
                u = k.parent.parent.right;
                if (u.color === "RED") {
                    u.color = "BLACK";
                    k.parent.color = "BLACK";
                    k.parent.parent.color = "RED";
                    k = k.parent.parent;
                } else {
                    if (k === k.parent.right) {
                        k = k.parent;
                        this.leftRotate(k);
                    }
                    k.parent.color = "BLACK";
                    k.parent.parent.color = "RED";
                    this.rightRotate(k.parent.parent);
                }
            }
            if (k === this.root) break;
        }
        this.root.color = "BLACK";
    }

    fixDelete(x) {
        let s;
        while (x !== this.root && x.color === "BLACK") {
            if (x === x.parent.left) {
                s = x.parent.right;
                if (s.color === "RED") {
                    s.color = "BLACK";
                    x.parent.color = "RED";
                    this.leftRotate(x.parent);
                    s = x.parent.right;
                }

                if (s.left.color === "BLACK" && s.right.color === "BLACK") {
                    s.color = "RED";
                    x = x.parent;
                } else {
                    if (s.right.color === "BLACK") {
                        s.left.color = "BLACK";
                        s.color = "RED";
                        this.rightRotate(s);
                        s = x.parent.right;
                    }

                    s.color = x.parent.color;
                    x.parent.color = "BLACK";
                    s.right.color = "BLACK";
                    this.leftRotate(x.parent);
                    x = this.root;
                }
            } else {
                s = x.parent.left;
                if (s.color === "RED") {
                    s.color = "BLACK";
                    x.parent.color = "RED";
                    this.rightRotate(x.parent);
                    s = x.parent.left;
                }

                if (s.left.color === "BLACK" && s.right.color === "BLACK") {
                    s.color = "RED";
                    x = x.parent;
                } else {
                    if (s.left.color === "BLACK") {
                        s.right.color = "BLACK";
                        s.color = "RED";
                        this.leftRotate(s);
                        s = x.parent.left;
                    }

                    s.color = x.parent.color;
                    x.parent.color = "BLACK";
                    s.left.color = "BLACK";
                    this.rightRotate(x.parent);
                    x = this.root;
                }
            }
        }
        x.color = "BLACK";
    }

    insert(key, val) {
        let item = new Item(key, val);
        item.left = this.TNULL;
        item.right = this.TNULL;
        let y = null;
        let x = this.root;
        while (x !== this.TNULL) {
            y = x;
            if (this.lessThan(item.key, x.key)) x = x.left;
            else x = x.right;
        }
        item.parent = y;
        if (y === null) this.root = item;
        else if (this.lessThan(item.key, y.key)) y.left = item;
        else y.right = item;
        if (item.parent === null) item.color = "BLACK";
        else if (item.parent.parent !== null) this.fixInsert(item);
    }

    delete(key) {
        let item = this.root;
        let z = this.TNULL;
        let x, y;
        while (item !== this.TNULL) {
            if (this.equal(item.key, key)) break;
            if (this.lessThan(item.key, key)) item = item.right;
            else item = item.left;
        }
        z = item;
        if (z === this.TNULL) return;
        y = z;
        let yOriginalColor = y.color;
        if (z.left === this.TNULL) {
            x = z.right;
            this.rbTransplant(z, z.right);
        } else if (z.right === this.TNULL) {
            x = z.left;
            this.rbTransplant(z, z.left);
        } else {
            y = this.minimum(z.right);
            yOriginalColor = y.color;
            x = y.right;
            if (y.parent === z) {
                x.parent = y;
            } else {
                this.rbTransplant(y, y.right);
                y.right = z.right;
                y.right.parent = y;
            }
            this.rbTransplant(z, y);
            y.left = z.left;
            y.left.parent = y;
            y.color = z.color;
        }
        if (yOriginalColor === "BLACK") this.fixDelete(x);
    }

    minimum(item) {
        while (item.left !== this.TNULL) item = item.left;
        return item;
    }

    maximum(item) {
        while (item.right !== this.TNULL) item = item.right;
        return item;
    }

    searchTreeHelper(item, key) {
        if (item === this.TNULL || this.equal(item.key, key)) return item;
        if (this.lessThan(key, item.key)) return this.searchTreeHelper(item.left, key);
        return this.searchTreeHelper(item.right, key);
    }

    searchTree(key) {
        return this.searchTreeHelper(this.root, key);
    }

    min() {
        return this.minimum(this.root).key;
    }

    max() {
        return this.maximum(this.root).key;
    }

    successor(x) {
        if (x.right !== this.TNULL) return this.minimum(x.right);
        let y = x.parent;
        while (y !== null && x === y.right) {
            x = y;
            y = y.parent;
        }
        return y;
    }

    predecessor(x) {
        if (x.left !== this.TNULL) return this.maximum(x.left);
        let y = x.parent;
        while (y !== null && x === y.left) {
            x = y;
            y = y.parent;
        }
        return y;
    }

    printHelper(item) {
        if (item !== this.TNULL) {
            this.printHelper(item.left);
            console.log(item);
            this.printHelper(item.right);
        }
    }

    print() {
        this.printHelper(this.root);
    }
}

class Item {
    constructor(key, val, color="RED", left=null, right=null, parent=null) {
        this.key = key;
        this.val = val;
        this.color = color;
        this.left = left;
        this.right = right;
        this.parent = parent;
    }
}

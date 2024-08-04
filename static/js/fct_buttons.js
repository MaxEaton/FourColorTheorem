import { diameter, nodes, lines, history, coloring, switchMode } from './fct_shared.js';
import { intersectLine, createLine, createCircle, nodeLessThan, nodeEqual, lineLessThan, lineEqual } from "./fct_utils.js";
import { RedBlackTree } from "./fct_rbtree.js";

export function fctUndo() {
    let previous = history.length > 0 ? history.pop() : null;
    if (!previous) return null;
    switch(previous) {
        case 'node':
            nodes.pop();
            document.getElementById(`fct-node${nodes.length}`).remove();
            return 'node';
        case 'line':
            lines.pop();
            document.getElementById(`fct-line${lines.length}`).remove();
            return 'line';
    }
}

export function fctClear() {
    while (fctUndo());
}

export function fctColor() {
    const fctcolor = document.getElementById('fct-color');
    if (!coloring) {
        fctcolor.textContent = 'Stop';
        let newNodes = nodes.map(node => ({...node}));
        newNodes.sort((a, b) => {
            if (a.x === b.x) return a.y - b.y;
            else return a.x - b.x;
        });
        let newLines = lines.map(line => ({...line}));
        newLines.sort((a, b) => {
            if (a.s.x !== b.s.x) return a.s.x - b.s.x;
            else if (a.s.y !== b.s.y) return a.s.y - b.s.y;
            else if (a.t.x !== b.t.x) return a.t.x - b.t.x;
            else return a.t.y - b.t.y;
        });

        let triangulated = triangulate([...newNodes], newLines);
        triangulated.forEach(line => createLine(line.s.x, line.s.y, line.t.x, line.t.y, 'fct-triangulated'));
        let triangles = getTriangles([...newNodes], triangulated);
        let {marksX, marksY} = quadrilateralate(triangles);
        marksX.forEach(line => createMark(line, 'red'));
        marksY.forEach(line => createMark(line, 'blue'));
        color(nodes, triangles);
    } else {
        document.querySelectorAll(`#fct-triangulated`).forEach(triangulated => triangulated.parentNode.removeChild(triangulated));
        document.querySelectorAll(`#fct-quadrilangulated`).forEach(quadrilangulated => quadrilangulated.parentNode.removeChild(quadrilangulated));
        fctcolor.textContent = 'Color';
    }
    switchMode();
}

function triangulate(nodes, lines) {
    // TODO: use CDT algorithm with RBT
    let doneNodes = [];
    let doneLines = lines.map(line => ({...line}));
    while (nodes.length > 0) {
        let node = nodes.shift();
        doneNodes.forEach(doneNode => {
            if (!doneLines.includes({s:doneNode, t:node}) &&
                !doneLines.some(doneLine => 
                    intersectLine(doneNode.x, doneNode.y, node.x, node.y, doneLine.s.x, doneLine.s.y, doneLine.t.x, doneLine.t.y))
               ) doneLines.push({s:doneNode, t:node});
        });
        doneNodes.push(node);
    }
    return doneLines;
}

function createMark(line, color) {
    const x = (line.s.x+line.t.x+diameter/2) / 2;
    const y = (line.s.y+line.t.y+diameter/2) / 2;
    const mark = createCircle(x, y, 'fct-quadrilangulated');
    mark.style.width = `${diameter/2}px`;
    mark.style.height = `${diameter/2}px`;
    mark.style.outline = `1px solid ${color}`;
    mark.style.left = `${x-diameter/2}px`;
    mark.style.top = `${y-diameter/2}px`;
    mark.style.zIndex = '902';
}

class Triangle {
    constructor(rank, line1, line2, line3, next1=null, next2=null, next3=null, escape='next1', escapeDist=Infinity, markX=null, markY=null) {
        this.rank = rank;
        this.line1 = line1;
        this.line2 = line2;
        this.line3 = line3;
        this.next1 = next1;
        this.next2 = next2;
        this.next3 = next3;
        this.markX = markX;
        this.markY = markY;
    }
}

function getLine(node1, node2) {
    if (nodeLessThan(node1, node2)) return {s:node1, t:node2};
    else return {s:node2, t:node1};
}

function getTriangles(nodes, lines) {
    function calculateSlope(node1, node2) {
        if (node1.x === node2.x) return Infinity;
        return (node2.y - node1.y) / (node2.x - node1.x);
    }
    function getQuadrant(item, node) {
        if (item.x < node.x && item.y >= node.y) return 1;
        if (item.x < node.x && item.y < node.y) return 2;
        if (item.x >= node.x && item.y < node.y) return 3;
        if (item.x >= node.x && item.y >= node.y) return 4;
    }

    const triangleTree = new RedBlackTree(lineLessThan, lineEqual);
    let triangles = [];
    nodes.forEach(node => {
        const nodeLines = lines.filter(line => (nodeEqual(node, line.s) && nodeLessThan(node, line.t)) || (nodeEqual(node, line.t) && nodeLessThan(node, line.s)));
        let nodeNodes = nodeLines.flatMap(line => nodeEqual(node, line.s) ? line.t : line.s);
        nodeNodes.sort((a, b) => {
            let quadrantA = getQuadrant(a, node);
            let quadrantB = getQuadrant(b, node);
            if (quadrantA !== quadrantB) {
                return quadrantA - quadrantB;
            } else {
                let slopeA = calculateSlope(node, a);
                let slopeB = calculateSlope(node, b)
                return slopeA - slopeB;
            }
        });
        
        for (let i=0; i<nodeNodes.length-1; i++) {
            const nodeL = nodeNodes[i];
            const nodeR = nodeNodes[i+1];
            if (!nodeL) {
                if (nodeR) triangleTree.delete(getLine(node, nodeR));
                continue;
            } else if (!nodeR) {
                triangleTree.delete(getLine(node, nodeL));
                continue;
            } else if (!lines.some(line => lineEqual(getLine(nodeL, nodeR), line))) {
                continue;
            }
            const lineL = getLine(node, nodeL);
            const lineR = getLine(node, nodeR);
            const lineA = getLine(nodeL, nodeR);
            const triangle = new Triangle(triangles.length, lineL, lineR, lineA);
            const { tri: triangleL=null, dir: dirL=null } = (triangleTree.searchTree(lineL).val ?? {});
            const { tri: triangleR=null, dir: dirR=null } = (triangleTree.searchTree(lineR).val ?? {});
            const { tri: triangleA=null, dir: dirA=null } = (triangleTree.searchTree(lineA).val ?? {});
            if (triangleL) {
                triangle.next1 = triangleL;
                triangleL[dirL] = triangle;
                triangleTree.delete(lineL);
            } else {
                triangleTree.insert(lineL, {tri: triangle, dir: 'next1'});
            }
            if (triangleR) {
                triangle.next2 = triangleR;
                triangleR[dirR] = triangle;
                triangleTree.delete(lineR);
            } else {
                triangleTree.insert(lineR, {tri: triangle, dir: 'next2'});
            }
            if (triangleA) {
                triangle.next3 = triangleA;
                triangleA[dirA] = triangle;
                triangleTree.delete(lineA);
            } else {
                triangleTree.insert(lineA, {tri: triangle, dir: 'next3'});
            }
            triangles.push(triangle);
        }
    });
    return triangles;
}

function getNext(triangle, rank) {
    for (let next of ['next1', 'next2', 'next3']) if (triangle[next] && triangle[next].rank === rank) return next
    return null;
}

function getEmpty(triangle, mark) {
    const nexts = [];
    ['next1', 'next2', 'next3'].forEach(next => {
        if (triangle.markX != next && triangle.markY != next && (!triangle[next] || !triangle[next][mark])) nexts.push(next);
    });
    return nexts;
}

function quadrilateralate(triangles) {
    // TODO: find worst case polynomial time solution
    function backtrack(triangle) {
        if (triangle === null || triangle.rank === null) return true;
        if (triangle.markX && triangle.markY) {
            let rank = triangle.rank;
            triangle.rank = null;
            if (backtrack(triangle.next1) && backtrack(triangle.next2) && backtrack(triangle.next3)) {
                triangle.rank = rank;
                return true;
            }
            triangle.rank = rank;
        } else if (triangle.markX) {
            let nexts = getEmpty(triangle, 'markY');
            for (let next of nexts) {
                triangle.markY = next;
                if (triangle[next]) triangle[next].markY = getNext(triangle[next], triangle.rank);
                if (backtrack(triangle)) return true;
                triangle.markY = null;
                if (triangle[next]) triangle[next].markY = null;
            };
        } else {
            let nexts = getEmpty(triangle, 'markX');
            for (let next of nexts) {
                triangle.markX = next;
                if (triangle[next]) triangle[next].markX = getNext(triangle[next], triangle.rank);
                if (backtrack(triangle)) return true;
                triangle.markX = null;
                if (triangle[next]) triangle[next].markX = null;
            };
        }
        return false;
    }

    let i = 0;
    // Start from different points in case backtracking fails (i.e. error in paper)
    while (i < triangles.length && !backtrack(triangles[i++]));
    if (i == triangles.length) console.log("FAILED");
    let marksX = [];
    let marksY = [];
    triangles.forEach(triangle => {
        if (triangle.markX === 'next1' && (!triangle.next1 || triangle.next1.rank)) marksX.push(triangle.line1);
        if (triangle.markX === 'next2' && (!triangle.next2 || triangle.next2.rank)) marksX.push(triangle.line2);
        if (triangle.markX === 'next3' && (!triangle.next3 || triangle.next3.rank)) marksX.push(triangle.line3);
        if (triangle.markY === 'next1' && (!triangle.next1 || triangle.next1.rank)) marksY.push(triangle.line1);
        if (triangle.markY === 'next2' && (!triangle.next2 || triangle.next2.rank)) marksY.push(triangle.line2);
        if (triangle.markY === 'next3' && (!triangle.next3 || triangle.next3.rank)) marksY.push(triangle.line3);
    });
    return {marksX, marksY};
}

function color(nodes, triangles) {
    function getIndex(node) {
        for (let i=0; i<nodes.length; i++) if (nodeEqual(node, nodes[i])) return i;
        return null;
    }
    function traverse(triangle) {
        if (triangle === null || triangle.rank === null) return;
        let rank = triangle.rank;
        triangle.rank = null;
        [{next:'next1', line:'line1'}, {next:'next2', line:'line2'}, {next:'next3', line:'line3'}].forEach(({next, line}) => {
            if (!triangle[next] || triangle[next].rank) {
                let i = getIndex(triangle[line].s);
                let j = getIndex(triangle[line].t);
                let prev = document.getElementById(`fct-node${i}`);
                let curr = document.getElementById(`fct-node${j}`);
                let color = prev.style.backgroundColor;
                if (color == 'red') {
                    if (triangle.markX == next) color = 'green';
                    else if (triangle.markY == next) color = 'black';
                    else color = 'blue';
                } else if (color == 'blue') {
                    if (triangle.markX == next) color = 'black';
                    else if (triangle.markY == next) color = 'green';
                    else color = 'red';
                } else if (color == 'green') {
                    if (triangle.markX == next) color = 'red';
                    else if (triangle.markY == next) color = 'blue';
                    else color = 'black';
                } else if (color == 'black') {
                    if (triangle.markX == next) color = 'blue';
                    else if (triangle.markY == next) color = 'red';
                    else color = 'green';
                } else {
                    return;
                }
                curr.style.backgroundColor = color;
            }
        });
        ['next1', 'next2', 'next3'].forEach(next => traverse(triangle[next]));
        triangle.rank = rank;
    }

    let i = getIndex(triangles[0].line1.s);
    document.getElementById(`fct-node${i}`).style.backgroundColor = 'black';
    traverse(triangles[0]);
}

/*
function quadrilateralate(nodes, lines) {
    function calculateSlope(node1, node2) {
        if (node1.x === node2.x) return Infinity;
        return (node2.y - node1.y) / (node2.x - node1.x);
    }
    function getQuadrant(item, node) {
        if (item.x < node.x && item.y >= node.y) return 1;
        if (item.x < node.x && item.y < node.y) return 2;
        if (item.x >= node.x && item.y < node.y) return 3;
        if (item.x >= node.x && item.y >= node.y) return 4;
    }
    function getLine(node1, node2) {
        if (nodeLessThan(node1, node2)) return {s:node1, t:node2};
        else return {s:node2, t:node1};
    }
    function updateDist(triangle, dir) {
        if (triangle.escape == dir) {
            let escape;
            let escapeDist = Infinity;
            if (dir !== 'next1') {
                if (triangle.next1 && escapeDist > triangle.next1.escapeDist+1) {
                    escape = 'next1';
                    escapeDist = triangle.next1.escapeDist+1;
                } else if (!triangle.next1) {
                    escape = 'next1';
                    escapeDist = 0;
                }
            }
            if (dir !== 'next2') {
                if (triangle.next2 && escapeDist > triangle.next2.escapeDist+1) {
                    escape = 'next2';
                    escapeDist = triangle.next2.escapeDist+1;
                } else if (!triangle.next2) {
                    escape = 'next2';
                    escapeDist = 0;
                }
            }
            if (dir !== 'next3') {
                if (triangle.next3 && escapeDist > triangle.next3.escapeDist+1) {
                    escape = 'next3';
                    escapeDist = triangle.next3.escapeDist+1;
                } else if (!triangle.next3) {
                    escape = 'next3';
                    escapeDist = 0;
                }
            }
            triangle.escape = escape;
            triangle.escapeDist = escapeDist;
        }
    }
    function getEmpty(dir1, dir2) {
        const nexts = ['next1', 'next2', 'next3'];
        for (let next of nexts) if (next !== dir1 && next !== dir2) return next;
    }
    function resolve(triangle, dir, mark, depth=0) {
        if (depth > 5) return;
        const contMark = mark === 'markX' ? 'markY' : 'markX';
        const empty = getEmpty(dir, triangle[contMark]);
        const contTriangle = triangle[empty];
        if (!contTriangle) {
            triangle[mark] = contTriangle;
        } else {
            const contNext = contTriangle[mark];
            const nextTriangle = contTriangle[contNext];
            triangle[mark] = empty;
            contTriangle[mark] = getEmpty(contNext, contTriangle[contMark]);
            if (nextTriangle) {
                nextTriangle[mark] = null;
                resolve(nextTriangle, contNext, mark, ++depth);
            }
        }
    }

    let marksX = [];
    let marksY = [];

    let doneNodes = [];
    const triangleTree = new RedBlackTree(lineLessThan, lineEqual);
    let triangles = [];
    while (nodes.length > 0) {
        const node = nodes.shift();
        const nodeLines = lines.filter(line => (nodeEqual(node, line.s) && nodeLessThan(node, line.t)) || (nodeEqual(node, line.t) && nodeLessThan(node, line.s)));
        let nodeNodes = nodeLines.flatMap(line => nodeEqual(node, line.s) ? line.t : line.s);
        nodeNodes.sort((a, b) => {
            let quadrantA = getQuadrant(a, node);
            let quadrantB = getQuadrant(b, node);
            if (quadrantA !== quadrantB) {
                return quadrantA - quadrantB;
            } else {
                let slopeA = calculateSlope(node, a);
                let slopeB = calculateSlope(node, b)
                // if (quadrantA === 1 || quadrantA === 2) return slopeB - slopeA;
                return slopeA - slopeB;
            }
        });
        
        for (let i=0; i<nodeNodes.length-1; i++) {
            const nodeL = nodeNodes[i];
            const nodeR = nodeNodes[i+1];
            if (!nodeL) {
                if (nodeR) triangleTree.delete(getLine(node, nodeR));
                continue;
            } else if (!nodeR) {
                triangleTree.delete(getLine(node, nodeL));
                continue;
            } else if (!lines.some(line => lineEqual(getLine(nodeL, nodeR), line))) {
                continue;
            }
            const lineL = getLine(node, nodeL);
            const lineR = getLine(node, nodeR);
            const lineA = getLine(nodeL, nodeR);
            const triangle = new Triangle(lineL, lineR, lineA);
            const { tri: triangleL=null, dir: dirL=null } = (triangleTree.searchTree(lineL).val ?? {});
            const { tri: triangleR=null, dir: dirR=null } = (triangleTree.searchTree(lineR).val ?? {});
            const { tri: triangleA=null, dir: dirA=null } = (triangleTree.searchTree(lineA).val ?? {});
            if (!triangleL) {
                triangle.escape = 'next1';
                triangle.escapeDist = 0;
            } else if (!triangleR) {
                triangle.escape = 'next2';
                triangle.escapeDist = 0;
            } else if (!triangleA) {
                triangle.escape = 'next3';
                triangle.escapeDist = 0;
            } else {
                let escape = 'next1';
                let escapeDist = triangleL.escapeDist;
                if (triangleR.escapeDist < escapeDist) {
                    escape = 'next2';
                    escapeDist = triangleR.escapeDist;
                }
                if (triangleA.escapeDist < escapeDist) {
                    escape = 'next3';
                    escapeDist = triangleA.escapeDist;
                }
                triangle.escape = escape;
                triangle.escapeDist = escapeDist+1;
            }
            if (triangleL) {
                triangle.next1 = triangleL;
                triangleL[dirL] = triangle;
                updateDist(triangleL, dirL);
                if (triangleL.markX === dirL) {
                    if (triangle.markX) {
                        triangleL.markX = null;
                        resolve(triangleL, dirL, 'markX');
                    } else {
                        triangle.markX = 'next1';
                    }
                }
                if (triangleL.markY === dirL) {
                    if (triangle.markY) {
                        resolve(triangleL, dirL, 'markY');
                    } else {
                        triangle.markY = 'next1';
                    }
                }
                triangleTree.delete(lineL);
            } else {
                triangleTree.insert(lineL, {tri: triangle, dir: 'next1'});
            }
            if (triangleR) {
                triangle.next2 = triangleR;
                triangleR[dirR] = triangle;
                updateDist(triangleR, dirR);
                if (triangleR.markX === dirR) {
                    if (triangle.markX) {
                        resolve(triangleR, dirR, 'markX');
                    } else {
                        triangle.markX = 'next2';
                    }
                }
                if (triangleR.markY === dirR) {
                    if (triangle.markY) {
                        resolve(triangleR, dirR, 'markY');
                    } else {
                        triangle.markY = 'next2';
                    }
                }
                triangleTree.delete(lineR);
            } else {
                triangleTree.insert(lineR, {tri: triangle, dir: 'next2'});
            }
            if (triangleA) {
                triangle.next3 = triangleA;
                triangleA[dirA] = triangle;
                updateDist(triangleA, dirA);
                if (triangleA.markX === dirA) {
                    if (triangle.markX) {
                        resolve(triangleA, dirA, 'markX');
                    } else {
                        triangle.markX = 'next3';
                    }
                }
                if (triangleA.markY === dirA) {
                    if (triangle.markY) {
                        resolve(triangleA, dirA, 'markX');
                    } else {
                        triangle.markY = 'next3';
                    }
                }
                triangleTree.delete(lineA);
            } else {
                triangleTree.insert(lineA, {tri: triangle, dir: 'next3'});
            }

            let markX = null;
            let sadMarkY = true;
            if (!triangle.markX) {
                if (triangle.markY !== 'next1' && !triangle.next1) markX = 'next1';
                else if (triangle.markY !== 'next2' && !triangle.next2) markX = 'next2';
                else if (triangle.markY !== 'next3' && !triangle.next3) markX = 'next3';
            }
            if (!triangle.markY) {
                sadMarkY = true;
                if (triangle.markX !== 'next1' && !triangle.next1 && markX !== 'next1') sadMarkY = false;
                else if (triangle.markX !== 'next2' && !triangle.next2 && markX !== 'next2') sadMarkY = false;
                else if (triangle.markX !== 'next3' && !triangle.next3 && markX !== 'next3') sadMarkY = false;
            }

            if (sadMarkY) {
                if (!triangle.markY) {
                    if (triangle.markX !== 'next1' && !triangle.next1) triangle.markY = 'next1';
                    else if (triangle.markX !== 'next2' && !triangle.next2) triangle.markY = 'next2';
                    else if (triangle.markX !== 'next3' && !triangle.next3) triangle.markY = 'next3';
                    else resolve(triangle, 'next1', 'markY');
                }
                if (!triangle.markX) {
                    if (triangle.markY !== 'next1' && !triangle.next1) triangle.markX = 'next1';
                    else if (triangle.markY !== 'next2' && !triangle.next2) triangle.markX = 'next2';
                    else if (triangle.markY !== 'next3' && !triangle.next3) triangle.markX = 'next3';
                    else resolve(triangle, 'next1', 'markX');
                }
            } else {
                if (!triangle.markX) {
                    if (triangle.markY !== 'next1' && !triangle.next1) triangle.markX = 'next1';
                    else if (triangle.markY !== 'next2' && !triangle.next2) triangle.markX = 'next2';
                    else if (triangle.markY !== 'next3' && !triangle.next3) triangle.markX = 'next3';
                    else resolve(triangle, 'next1', 'markX');
                }
                if (!triangle.markY) {
                    if (triangle.markX !== 'next1' && !triangle.next1) triangle.markY = 'next1';
                    else if (triangle.markX !== 'next2' && !triangle.next2) triangle.markY = 'next2';
                    else if (triangle.markX !== 'next3' && !triangle.next3) triangle.markY = 'next3';
                    else resolve(triangle, 'next1', 'markY');
                }

            }
            triangles.push(triangle);
        }
        doneNodes.push(node);
    }

    triangles.forEach(triangle => {
        if (triangle.markX === 'next1' && (!triangle.next1 || triangle.next1.markX)) marksX.push(triangle.line1);
        if (triangle.markX === 'next2' && (!triangle.next2 || triangle.next2.markX)) marksX.push(triangle.line2);
        if (triangle.markX === 'next3' && (!triangle.next3 || triangle.next3.markX)) marksX.push(triangle.line3);
        triangle.markX = null;
        if (triangle.markY === 'next1' && (!triangle.next1 || triangle.next1.markY)) marksY.push(triangle.line1);
        if (triangle.markY === 'next2' && (!triangle.next2 || triangle.next2.markY)) marksY.push(triangle.line2);
        if (triangle.markY === 'next3' && (!triangle.next3 || triangle.next3.markY)) marksY.push(triangle.line3);
        triangle.markY = null;
    });
    return {marksX, marksY};
}
*/
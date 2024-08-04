import { diameter, nodes, lines, history, coloring } from './fct_shared.js';
import { createCircle, createLine, intersectLine, intersectCircle, updateFollowCircle, updateFollowLine, tooClose, overlap } from "./fct_utils.js";
import { fctUndo, fctClear, fctColor } from "./fct_buttons.js";

const fctbuttons = document.getElementById('fct-buttons');
const buttonswidth = fctbuttons.getBoundingClientRect().width - 4;
const buttonsheight = fctbuttons.getBoundingClientRect().height - 4;
fctbuttons.style.width = `${buttonswidth}px`;
fctbuttons.style.height = `${buttonsheight}px`;
const fctbox = document.getElementById('fct-box');
const width = fctbox.getBoundingClientRect().width - 4;
const height = fctbox.getBoundingClientRect().height - 4;
fctbox.style.width = `${width}px`;
fctbox.style.height = `${height}px`;

let currNode = null;
let nextNode = null;

fctbox.addEventListener('mouseup', function(e) {
    if (coloring) return;
    if (currNode) {
        const rect = fctbox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        nextNode = overlap(x, y);
        if (nextNode) {
            let intersects = lines.some(line => {
                return intersectLine(currNode.x, currNode.y, nextNode.x, nextNode.y, line.s.x, line.s.y, line.t.x, line.t.y);
            });

            intersects |= nodes.some(node => {
                return node != currNode && node != nextNode && 
                        intersectCircle(currNode.x, currNode.y, nextNode.x, nextNode.y, node.x, node.y, diameter/2);
            });

            if (!intersects) {
                createLine(currNode.x, currNode.y, nextNode.x, nextNode.y, `fct-line${lines.length}`);
                const newLine = (currNode.x < nextNode.x) || (currNode.x === nextNode.x && currNode.y <= nextNode.y) 
                                ? {s: currNode, t: nextNode} : {s: nextNode, t: currNode};
                lines.push(newLine);
                history.push('line');
            }
        }
        nextNode = null;
        currNode = null;
    } else {
        followCircle.style.visibility = 'visible';
    }
});

fctbox.addEventListener('mousedown', function(e) {
    if (coloring) return;
    const rect = fctbox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currNode = overlap(x, y);
    let ontheline = lines.some(line => {
        return intersectCircle(line.s.x, line.s.y, line.t.x, line.t.y, x-diameter/2, y-diameter/2, diameter/2);
    });
    if (!tooClose(x, y) && !ontheline) {
        const newNode = {x:(x-diameter/2), y:(y-diameter/2)};
        createCircle(x, y, `fct-node${nodes.length}`).style.backgroundColor = '#666666';
        nodes.push(newNode);
        history.push('node');
        followCircle.style.outline = '2px dotted #bbbbbb';
    }
    followCircle.style.visibility = 'hidden';
});

fctbox.addEventListener('mousemove', function(e) {
    if (coloring) return;
    const rect = fctbox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= diameter && x <= width && y >= diameter && y <= height) {
        if (currNode) {
            updateFollowLine(currNode.x, currNode.y, x, y);
            let intersects = lines.some(line => {
                return intersectLine(currNode.x, currNode.y, x, y, line.s.x, line.s.y, line.t.x, line.t.y);
            });
            
            let intersectCount = nodes.filter(node => {
                return node != currNode && intersectCircle(currNode.x, currNode.y, x, y, node.x, node.y, diameter/2);
            }).length;
            intersectCount = intersectCount - (overlap(x, y) ? 1 : 0);

            intersects |= intersectCount == 1;
            
            followLine.style.visibility = 'visible';
            followLine.style.outline = intersects ? '1px dotted #bbbbbb' : '1px dotted #222222';
            followCircle.style.visibility = 'hidden';
        } else {
            updateFollowCircle(x, y);
            followCircle.style.visibility = 'visible';
            let ontheline = lines.some(line => {
                return intersectCircle(line.s.x, line.s.y, line.t.x, line.t.y, x-diameter/2, y-diameter/2, diameter/2);
            });
            followCircle.style.outline = tooClose(x, y) || ontheline ? '2px dotted #bbbbbb' : '2px dotted #222222';
            followLine.style.visibility = 'hidden';
        }
    } else {
        followCircle.style.visibility = 'hidden';
    }
});

fctbox.addEventListener('mouseleave', function() {
    followCircle.style.visibility = 'hidden';
    followLine.style.visibility = 'hidden';
    currNode = null;
});

const followCircle = createCircle(0, 0, 'fct-node');
followCircle.style.outline = '2px dotted #bbbbbb';
followCircle.style.visibility = 'hidden';
fctbox.appendChild(followCircle);
const followLine = createLine(0, 0, 200, 100, 'fct-line');
followLine.style.outline = '1px dotted #bbbbbb';
followLine.style.visibility = 'hidden';
fctbox.appendChild(followLine);

const fctundo = document.getElementById('fct-undo');
const fctclear = document.getElementById('fct-clear');
const fctcolor = document.getElementById('fct-color');
fctundo.addEventListener('click', fctUndo);
fctclear.addEventListener('click', fctClear);
fctcolor.addEventListener('click', fctColor);

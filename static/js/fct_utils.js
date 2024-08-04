import { diameter, nodes, lines, history, coloring } from './fct_shared.js';

export function createCircle(x, y, id) {
    const fctbox = document.getElementById('fct-box');
    const circle = document.createElement('div');
    circle.style.position = 'absolute';
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.borderRadius = '50%';
    circle.style.outline = '2px solid #222222';
    circle.style.left = `${x - diameter}px`;
    circle.style.top = `${y - diameter}px`;
    circle.style.zIndex = '901';
    circle.id = id;
    fctbox.appendChild(circle);
    return circle;
}

export function createLine(a, b, x, y, id) {
    const fctbox = document.getElementById('fct-box');
    const line = document.createElement('div');
    const length = Math.sqrt((x - a) ** 2 + (y - b) ** 2);
    const angle = Math.atan2(y - b, x - a) * 180 / Math.PI;
    line.style.position = 'absolute';
    line.style.width = `${length}px`;
    line.style.height = '0px';
    line.style.outline = '1px solid #222222';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';
    line.style.left = `${a}px`;
    line.style.top = `${b}px`;
    line.style.zIndex = '900';
    line.id = id;
    fctbox.appendChild(line);
    return line;
}

export function intersectLine(a1, b1, x1, y1, a2, b2, x2, y2) {
    function orientation(px, py, qx, qy, rx, ry) {
        const val = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
        if (val === 0) return 0;
        return (val > 0) ? 1 : 2;
    }
    function onSegment(px, py, qx, qy, rx, ry) {
        return rx <= Math.max(px, qx) && rx >= Math.min(px, qx) &&
                ry <= Math.max(py, qy) && ry >= Math.min(py, qy);
    }
    function shareEnd(s1, t1, s2, t2) {
        return s1 == s2 && t1 == t2;
    }
    
    if ((shareEnd(a1, b1, a2, b2) && !shareEnd(x1, y1, x2, y2)) ||
        (!shareEnd(a1, b1, a2, b2) && shareEnd(x1, y1, x2, y2)) ||
        (shareEnd(a1, b1, x2, y2) && !shareEnd(x1, y1, a2, b2)) ||
        (!shareEnd(a1, b1, x2, y2) && shareEnd(x1, y1, a2, b2))) 
        return false;

    const o1 = orientation(a1, b1, x1, y1, a2, b2);
    const o2 = orientation(a1, b1, x1, y1, x2, y2);
    const o3 = orientation(a2, b2, x2, y2, a1, b1);
    const o4 = orientation(a2, b2, x2, y2, x1, y1);
    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(a1, b1, x1, y1, a2, b2)) return true;
    if (o2 === 0 && onSegment(a1, b1, x1, y1, x2, y2)) return true;
    if (o3 === 0 && onSegment(a2, b2, x2, y2, a1, b1)) return true;
    if (o4 === 0 && onSegment(a2, b2, x2, y2, x1, y1)) return true;
    return false;
}

export function intersectCircle(a, b, x, y, cx, cy, r) {
    const dx = x - a;
    const dy = y - b;
    const fx = a - cx;
    const fy = b - cy;
    const aCoef = dx * dx + dy * dy;
    const bCoef = 2 * (fx * dx + fy * dy);
    const cCoef = fx * fx + fy * fy - r * r;
    const discriminant = bCoef * bCoef - 4 * aCoef * cCoef;
    if (discriminant < 0) return false;
    const t0 = (-bCoef - Math.sqrt(discriminant)) / (2 * aCoef);
    const t1 = (-bCoef + Math.sqrt(discriminant)) / (2 * aCoef);
    if ((t0 >= 0 && t0 <= 1) || (t1 >= 0 && t1 <= 1)) return true;
    return false;
}

export function updateFollowCircle(x, y) {
    const followCircle = document.getElementById('fct-node');
    followCircle.style.left = `${x - diameter}px`;
    followCircle.style.top = `${y - diameter}px`;
}

export function updateFollowLine(a, b, x, y) {
    const followLine = document.getElementById('fct-line');
    if (followLine) {
        const length = Math.sqrt((x - a) ** 2 + (y - b) ** 2);
        const angle = Math.atan2(y - b, x - a) * 180 / Math.PI;
        followLine.style.width = `${length}px`;
        followLine.style.transform = `rotate(${angle}deg)`;
        followLine.style.transformOrigin = '0 0';
        followLine.style.left = `${a}px`;
        followLine.style.top = `${b}px`;
    }
}

export function tooClose(x, y) {
    return nodes.some(node => {
        const dx = x-diameter/2 - node.x;
        const dy = y-diameter/2 - node.y;
        return (dx * dx + dy * dy) < diameter * diameter * 4;
    });
}

export function overlap(x, y) {
    return nodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return (dx * dx + dy * dy) < diameter * diameter;
    }) || null;
}

export function nodeLessThan(a, b) {
    return a.x < b.x || (a.x === b.x && a.y < b.y);
}

export function nodeEqual(a, b) {
    return a.x === b.x && a.y === b.y;
}

export function lineLessThan(a, b) {
    return nodeLessThan(a.s, b.s) || (nodeEqual(a.s, b.s) && nodeLessThan(a.t, b.t));
}

export function lineEqual(a, b) {
    return nodeEqual(a.s, b.s) && nodeEqual(a.t, b.t);
}

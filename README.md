# Proof of the Four Color Theorem

## Overview

The Four Color Theorem states that any planar graph can be colored with no more than four colors such that no two adjacent regions share the same color. This theorem was first proved in 1976 by Kenneth Appel and Wolfgang Haken using computer-assisted methods. It marked a milestone in the use of computational methods in mathematical proofs.

## Background

During high school, I wrote a paper on the Four Color Theorem and encountered an algorithm developed in the 1800s by mathematician Peter Guthrie Tait. This inspired me to explore a potential novel proof of the theorem without computer assistance. Despite consulting professors and peers, I received no useful feedback and decided to pursue a hands-on approach by implementing the algorithm.

Initially, my optimism led me to explore efficient triangulation methods to improve my naive $O(n^2)$ approach using a Constrained Delaunay Triangulation algorithm, aiming for an optimized $O(n \log n)$ time complexity. I believed that achieving an algorithm faster than the current best-known $O(n^2)$ algorithm was feasible based on my paper. However, I soon encountered significant problems and discovered a glaring error in my paper related to an invalid case in the induction proof.

## Current Efforts

Despite this setback, I am determined to find a solution to remedy the error. In the meantime, I have implemented a backtracking algorithm that emulates the core idea of the original algorithm. Below, you will find the paper and instructions on how to use the tool. More features are coming soon!

## The Inciting Paper

You can view the paper here:

[**FCTPaper.pdf**](static/files/FCTPaper.pdf)

## Using the Tool

Here’s how you can interact with the tool:

- **Click** anywhere within the constraints to create a node.
- **Drag** between nodes to create edges.
- Nodes must be a radius apart to ensure edges are visible.
- Edges cannot intersect nodes or other edges.
- The **Undo** button will remove the last node or edge added.
- The **Clear** button will remove all nodes and edges.
- The **Color** button will apply the algorithm to color all nodes.

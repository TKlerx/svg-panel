import { describe, expect, it } from "vitest";
import { getUnmatchedAreas, hasMatchedDescendant, isRelatedToMatchedArea, type AreaNode } from "./unmatchedAreas";

class FakeArea implements AreaNode {
    public readonly children: FakeArea[] = [];

    constructor(public readonly id: string) {}

    append(child: FakeArea): FakeArea {
        this.children.push(child);
        return child;
    }

    contains(other: AreaNode): boolean {
        if (other === this) {
            return true;
        }

        return this.children.some((child) => child.contains(other));
    }
}

describe("hasMatchedDescendant", () => {
    it("detects matched descendants but not the area itself", () => {
        const parent = new FakeArea("parent");
        const child = parent.append(new FakeArea("child"));

        expect(hasMatchedDescendant(parent, new Set([child]))).toBe(true);
        expect(hasMatchedDescendant(child, new Set([child]))).toBe(false);
    });
});

describe("isRelatedToMatchedArea", () => {
    it("keeps ancestors and descendants related to matched areas visible", () => {
        const parent = new FakeArea("parent");
        const child = parent.append(new FakeArea("child"));
        const grandchild = child.append(new FakeArea("grandchild"));
        const sibling = new FakeArea("sibling");
        const matched = new Set([child]);

        expect(isRelatedToMatchedArea(parent, matched)).toBe(true);
        expect(isRelatedToMatchedArea(grandchild, matched)).toBe(true);
        expect(isRelatedToMatchedArea(sibling, matched)).toBe(false);
    });
});

describe("getUnmatchedAreas", () => {
    it("excludes matched areas and their ancestors from unmatched results", () => {
        const parent = new FakeArea("parent");
        const child = parent.append(new FakeArea("child"));
        const unrelated = new FakeArea("unrelated");

        const unmatched = getUnmatchedAreas(new Set([parent, child, unrelated]), new Set([child]));

        expect([...unmatched].map((area) => area.id)).toEqual(["unrelated"]);
    });

    it("keeps descendants of a matched group out of the unmatched bucket only when they are matched", () => {
        const group = new FakeArea("group");
        const matchedChild = group.append(new FakeArea("matchedChild"));
        const unmatchedChild = group.append(new FakeArea("unmatchedChild"));

        const unmatched = getUnmatchedAreas(new Set([group, matchedChild, unmatchedChild]), new Set([matchedChild]));

        expect([...unmatched].map((area) => area.id)).toEqual(["unmatchedChild"]);
    });
});

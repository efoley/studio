// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

export class SortedList<K, V> {
  private _list: [K, V][] = [];

  // eslint-disable-next-line no-restricted-syntax
  get size(): number {
    return this._list.length;
  }

  clear(): void {
    this._list.length = 0;
  }

  at(index: number): [K, V] | undefined {
    return this._list[index];
  }

  set(key: K, value: V): void {
    const index = this.binarySearch(key);
    if (index >= 0) {
      this._list[index]![1] = value;
    } else {
      const greaterThanIndex = ~index;
      const newEntry: [K, V] = [key, value];
      if (greaterThanIndex >= this._list.length) {
        this._list.push(newEntry);
      } else {
        this._list.splice(greaterThanIndex, 0, newEntry);
      }
    }
  }

  shift(): [K, V] | undefined {
    return this._list.shift();
  }

  pop(): [K, V] | undefined {
    return this._list.pop();
  }

  minEntry(): [K, V] | undefined {
    return this._list[0];
  }

  maxEntry(): [K, V] | undefined {
    return this._list[this._list.length - 1];
  }

  minKey(): K | undefined {
    return this._list[0]?.[0];
  }

  maxKey(): K | undefined {
    return this._list[this._list.length - 1]?.[0];
  }

  binarySearch(key: K): number {
    const list = this._list;
    if (list.length === 0) {
      return -1;
    }

    let left = 0;
    let right = list.length - 1;

    while (left <= right) {
      const mid = (left + right) >> 1;
      const midKey = list[mid]![0];

      if (midKey === key) {
        return mid;
      } else if (key < midKey) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return ~left;
  }
}

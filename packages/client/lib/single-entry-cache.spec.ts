import assert from 'node:assert';
import SingleEntryCache from './single-entry-cache';

describe('SingleEntryCache', () => {
  let cache: SingleEntryCache;
  beforeEach(() => {
    cache = new SingleEntryCache();
  });
  
  it('should return undefined when getting from empty cache', () => {
    assert.strictEqual(cache.get({ key: 'value' }), undefined);
  });

  it('should return the cached instance when getting with the same key object', () => {
    const keyObj = { key: 'value' };
    const instance = { data: 'test data' };
    
    cache.set(keyObj, instance);
    assert.strictEqual(cache.get(keyObj), instance);
  });

  it('should return undefined when getting with a different key object', () => {
    const keyObj1 = { key: 'value1' };
    const keyObj2 = { key: 'value2' };
    const instance = { data: 'test data' };
    
    cache.set(keyObj1, instance);
    assert.strictEqual(cache.get(keyObj2), undefined);
  });

  it('should update the cached instance when setting with the same key object', () => {
    const keyObj = { key: 'value' };
    const instance1 = { data: 'test data 1' };
    const instance2 = { data: 'test data 2' };
    
    cache.set(keyObj, instance1);
    assert.strictEqual(cache.get(keyObj), instance1);
    
    cache.set(keyObj, instance2);
    assert.strictEqual(cache.get(keyObj), instance2);
  });

  it('should handle undefined key object', () => {
    const instance = { data: 'test data' };
    
    cache.set(undefined, instance);
    assert.strictEqual(cache.get(undefined), instance);
  });

  it('should handle complex objects as keys', () => {
    const keyObj = { 
      id: 123,
      nested: { 
        prop: 'value',
        array: [1, 2, 3]
      }
    };
    const instance = { data: 'complex test data' };
    
    cache.set(keyObj, instance);
    assert.strictEqual(cache.get(keyObj), instance);
  });

  it('should consider objects with same properties but different order as different keys', () => {
    const keyObj1 = { a: 1, b: 2 };
    const keyObj2 = { b: 2, a: 1 }; // Same properties but different order
    const instance = { data: 'test data' };
    
    cache.set(keyObj1, instance);
    
    assert.strictEqual(cache.get(keyObj2), undefined);
  });

  it('should handle circular structures', () => {
    const keyObj: any = {};
    keyObj.self = keyObj;

    const instance = { data: 'test data' };
    
    cache.set(keyObj, instance);
    
    assert.strictEqual(cache.get(keyObj), instance);
  });

});

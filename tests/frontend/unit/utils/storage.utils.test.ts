import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '@/utils/storage.utils';

describe('storage.utils unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should get default theme as dark if not set', () => {
    expect(storage.getTheme()).toBe('dark');
  });

  it('should set and get theme mode', () => {
    storage.setTheme('light');
    expect(storage.getTheme()).toBe('light');
  });

  it('should return empty array for deletedForMe initially', () => {
    expect(storage.getDeletedForMe()).toEqual([]);
  });

  it('should add message id to deletedForMe', () => {
    storage.addDeletedForMe('msg_101');
    expect(storage.getDeletedForMe()).toContain('msg_101');
  });

  it('should return empty array for deletedForEveryone initially', () => {
    expect(storage.getDeletedForEveryone()).toEqual([]);
  });

  it('should add message id to deletedForEveryone', () => {
    storage.addDeletedForEveryone('msg_202');
    expect(storage.getDeletedForEveryone()).toContain('msg_202');
  });

  it('should return empty object for messagesMap initially', () => {
    expect(storage.getMessagesMap()).toEqual({});
  });

  it('should store and retrieve messagesMap', () => {
    const map = { conv_1: [{ id: '1', text: 'Hello' }] };
    storage.setMessagesMap(map);
    expect(storage.getMessagesMap()).toEqual(map);
  });
});

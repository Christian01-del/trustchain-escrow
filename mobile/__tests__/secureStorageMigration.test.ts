import { migrateSecureStorageKeys, secureStorage } from '../lib/storage';

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __store: store,
  };
});

describe('secure storage migration', () => {
  beforeEach(async () => {
    await secureStorage.delete('legacy_wallet');
    await secureStorage.delete('wallet_v2');
  });

  it('copies legacy values to the new key and removes the old key by default', async () => {
    await secureStorage.set('legacy_wallet', 'encrypted-session');

    const migrated = await migrateSecureStorageKeys([{ from: 'legacy_wallet', to: 'wallet_v2' }]);

    expect(migrated).toEqual(['wallet_v2']);
    expect(await secureStorage.get('wallet_v2')).toBe('encrypted-session');
    expect(await secureStorage.get('legacy_wallet')).toBeNull();
  });

  it('does not overwrite an existing migrated value', async () => {
    await secureStorage.set('legacy_wallet', 'old-session');
    await secureStorage.set('wallet_v2', 'current-session');

    const migrated = await migrateSecureStorageKeys([{ from: 'legacy_wallet', to: 'wallet_v2' }]);

    expect(migrated).toEqual([]);
    expect(await secureStorage.get('wallet_v2')).toBe('current-session');
    expect(await secureStorage.get('legacy_wallet')).toBe('old-session');
  });
});

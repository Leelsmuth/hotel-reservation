/**
 * A small in-memory stand-in for the `firebase/firestore` functions that
 * lib/data/firestoreRepository.js uses, so its logic can be tested without
 * Firebase. Like Firestore, a transaction must do every read before its
 * first write, and its writes only apply if it succeeds.
 *
 * `store` maps document paths ("rooms/abc") to their data.
 */
export const store = new Map();
let autoId = 0;

const copy = (value) => structuredClone(value);
const ARRAY_UNION = Symbol('arrayUnion');

export const db = { fake: true };

export const collection = (_db, name) => ({ kind: 'collection', name });

export const doc = (first, second, third) => {
  const path =
    first?.kind === 'collection'
      ? `${first.name}/${second ?? `auto${(autoId += 1)}`}`
      : third
        ? `${second}/${third}`
        : second;
  return { kind: 'doc', path, id: path.split('/')[1] };
};

const snapshotOf = (ref) => ({
  id: ref.id,
  exists: () => store.has(ref.path),
  data: () => copy(store.get(ref.path)),
});

export const getDoc = async (ref) => snapshotOf(ref);

export const where = (field, op, value) => ({ field, op, value });
export const limit = (count) => ({ limit: count });
export const query = (coll, ...constraints) => ({ coll, constraints });

const fieldOf = (data, field) =>
  field.split('.').reduce((value, key) => value?.[key], data);

export const getDocs = async ({ coll, constraints }) => {
  let docs = [...store.entries()]
    .filter(([path]) => path.startsWith(`${coll.name}/`))
    .filter(([, data]) =>
      constraints.every((c) => {
        if (!c.field) return true;
        const value = fieldOf(data, c.field);
        if (c.op === '==') return value === c.value;
        if (c.op === 'in') return c.value.includes(value);
        throw new Error(`Fake Firestore: unsupported operator ${c.op}`);
      })
    )
    .map(([path]) => snapshotOf({ path, id: path.split('/')[1] }));
  const max = constraints.find((c) => c.limit)?.limit;
  if (max) docs = docs.slice(0, max);
  return { docs, empty: docs.length === 0, forEach: (fn) => docs.forEach(fn) };
};

export const arrayUnion = (...items) => ({ [ARRAY_UNION]: items });

const applyUpdate = (path, updates) => {
  if (!store.has(path)) throw new Error(`No document to update: ${path}`);
  const data = store.get(path);
  for (const [key, value] of Object.entries(updates)) {
    if (value && value[ARRAY_UNION]) {
      const list = data[key] || [];
      value[ARRAY_UNION].forEach((item) => {
        if (!list.some((x) => JSON.stringify(x) === JSON.stringify(item))) {
          list.push(copy(item));
        }
      });
      data[key] = list;
    } else {
      data[key] = copy(value);
    }
  }
};

export const runTransaction = async (_db, work) => {
  let hasWritten = false;
  const writes = [];
  const transaction = {
    get: async (ref) => {
      if (hasWritten) {
        throw new Error(
          'Firestore transactions require all reads to be executed before all writes.'
        );
      }
      return snapshotOf(ref);
    },
    set: (ref, data) => {
      hasWritten = true;
      writes.push(() => store.set(ref.path, copy(data)));
    },
    update: (ref, data) => {
      hasWritten = true;
      writes.push(() => applyUpdate(ref.path, data));
    },
  };
  const result = await work(transaction);
  writes.forEach((write) => write());
  return result;
};

export const writeBatch = () => {
  const writes = [];
  return {
    update: (ref, data) => writes.push(() => applyUpdate(ref.path, data)),
    commit: async () => writes.forEach((write) => write()),
  };
};

export const setDoc = async (ref, data) => store.set(ref.path, copy(data));
export const addDoc = async (coll, data) => {
  const ref = doc(coll);
  store.set(ref.path, copy(data));
  return ref;
};
export const updateDoc = async (ref, data) => applyUpdate(ref.path, data);
export const serverTimestamp = () => 'SERVER_TIMESTAMP';

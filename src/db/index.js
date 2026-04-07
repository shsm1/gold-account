import { openDB } from 'idb'

const DB_NAME = 'gold-account-db'
const DB_VERSION = 2
const STORE_NAME = 'transactions'
const ICBC_STORE_NAME = 'icbc-transactions'

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('date', 'date')
          store.createIndex('type', 'type')
        }
        if (!db.objectStoreNames.contains(ICBC_STORE_NAME)) {
          const icbcStore = db.createObjectStore(ICBC_STORE_NAME, { keyPath: 'id' })
          icbcStore.createIndex('date', 'date')
          icbcStore.createIndex('type', 'type')
        }
      }
    })
  }
  return dbPromise
}

export async function addTransaction(transaction) {
  const db = await getDB()
  return db.put(STORE_NAME, transaction)
}

export async function deleteTransaction(id) {
  const db = await getDB()
  return db.delete(STORE_NAME, id)
}

export async function getAllTransactions() {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return all.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function getTransaction(id) {
  const db = await getDB()
  return db.get(STORE_NAME, id)
}

export async function clearAllTransactions() {
  const db = await getDB()
  return db.clear(STORE_NAME)
}

export async function importTransactions(transactions) {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const t of transactions) {
    await tx.store.put(t)
  }
  await tx.done
}

export async function addIcbcTransaction(transaction) {
  const db = await getDB()
  const tx = {
    ...transaction,
    type: transaction.type || 'buy',
    batchId: transaction.type === 'buy' ? transaction.batchId || generateId() : undefined,
    sourceBatchId: transaction.type !== 'buy' ? transaction.sourceBatchId : undefined,
    fee: transaction.fee || 0
  }
  return db.put(ICBC_STORE_NAME, tx)
}

export async function deleteIcbcTransaction(id) {
  const db = await getDB()
  return db.delete(ICBC_STORE_NAME, id)
}

export async function getAllIcbcTransactions() {
  const db = await getDB()
  const all = await db.getAll(ICBC_STORE_NAME)
  return all.sort((a, b) => new Date(b.date) - new Date(a.date))
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

import { customAlphabet, nanoid } from 'nanoid'

const shortAlphabet = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)

export function shortId(length = 8): string {
  return shortAlphabet(length)
}

export function generateId(length = 12) {
  return nanoid(length)
}
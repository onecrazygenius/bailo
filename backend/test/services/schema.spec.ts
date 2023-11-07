import { MongoServerError } from 'mongodb'
import { describe, expect, test, vi } from 'vitest'

import { UserDoc } from '../../src/models/v2/User.js'
import { createSchema, findSchemaById, findSchemasByKind } from '../../src/services/v2/schema.js'
import { testModelSchema } from '../testUtils/testModels.js'

const mockSchema = vi.hoisted(() => {
  const mockedMethods = {
    save: vi.fn(),
    deleteOne: vi.fn(),
    find: vi.fn(() => ({ sort: vi.fn(() => ['schema-1', 'schema-2']) })),
    findOne: vi.fn(),
  }

  const Schema: any = vi.fn(() => ({
    save: mockedMethods.save,
  }))
  Schema.find = mockedMethods.find
  Schema.findOne = mockedMethods.findOne
  Schema.deleteOne = mockedMethods.deleteOne

  return {
    ...mockedMethods,
    Schema,
  }
})
vi.mock('../../src/models/v2/Schema.js', () => ({
  default: mockSchema.Schema,
}))

const mockMongoUtils = vi.hoisted(() => {
  return {
    isMongoServerError: vi.fn(),
  }
})
vi.mock('../../utils/v2/mongo.js', () => mockMongoUtils)

const authorisationMocks = vi.hoisted(() => ({
  userSchemaAction: vi.fn(() => true),
}))
vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  default: authorisationMocks,
}))

describe('services > schema', () => {
  const testUser = { dn: 'user' } as UserDoc

  test('that all schemas can be retrieved', async () => {
    const result = await findSchemasByKind('model')
    expect(result).toEqual(['schema-1', 'schema-2'])
  })

  test('a schema can be created', async () => {
    mockSchema.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema)
    expect(mockSchema.save).toBeCalledTimes(1)
    expect(mockSchema.deleteOne).not.toBeCalled()
    expect(result).toBe(testModelSchema)
  })

  test('a schema cannot be created due to authorisation', async () => {
    authorisationMocks.userSchemaAction.mockResolvedValueOnce(false)

    const result = () => createSchema(testUser, testModelSchema)
    expect(result).rejects.toThrowError(/^You do not have permission to create this schema./)

    expect(mockSchema.save).not.toBeCalled()
    expect(mockSchema.deleteOne).not.toBeCalled()
  })

  test('a schema can be overwritten', async () => {
    mockSchema.save.mockResolvedValueOnce(testModelSchema)
    const result = await createSchema(testUser, testModelSchema, true)
    expect(mockSchema.deleteOne).toBeCalledTimes(1)
    expect(mockSchema.save).toBeCalledTimes(1)
    expect(result).toBe(testModelSchema)
  })

  test('an error is thrown on create collision', async () => {
    const mongoError = new MongoServerError({})
    mongoError.code = 11000
    mongoError.keyValue = {
      mockKey: 'mockValue',
    }
    mockSchema.save.mockRejectedValueOnce(mongoError)
    mockMongoUtils.isMongoServerError.mockReturnValueOnce(true)

    expect(() => createSchema(testUser, testModelSchema)).rejects.toThrowError(
      /^The following is not unique: {"mockKey":"mockValue"}/,
    )
  })

  test('that a schema can be retrieved by ID', async () => {
    mockSchema.findOne.mockResolvedValueOnce(testModelSchema)
    const result = await findSchemaById(testModelSchema.id)
    expect(result).toEqual(testModelSchema)
  })

  test('that a schema cannot be retrieved by ID when schema does not exist', async () => {
    expect(() => findSchemaById(testModelSchema.id)).rejects.toThrowError(/^The requested schema was not found/)
  })
})

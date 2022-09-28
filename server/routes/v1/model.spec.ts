import _ from 'lodash'
import mongoose from 'mongoose'
import DeploymentModel from '../../models/Deployment'
import ModelModel from '../../models/Model'
import SchemaModel from '../../models/Schema'
import UserModel from '../../models/User'
import VersionModel from '../../models/Version'
import '../../utils/mockMongo'
import {
  modelId,
  modelUuid,
  testDeployment,
  testModel,
  testUser,
  testVersion,
  uploadSchema,
} from '../../utils/test/testModels'
import { authenticatedGetRequest, authenticatedDeleteRequest, validateTestRequest } from '../../utils/test/testUtils'

describe('test model routes', () => {
  beforeEach(async () => {
    const updatedTestModel = _.cloneDeep(testModel)
    await SchemaModel.create(uploadSchema)
    await UserModel.create(testUser)
    await DeploymentModel.create(testDeployment)
    const version = await VersionModel.create(testVersion)
    updatedTestModel.versions.push(version._id)
    await ModelModel.create(updatedTestModel)
  })

  test('that we can fetch all models', async () => {
    const res = await authenticatedGetRequest('/api/v1/models?type=all&filter=')
    validateTestRequest(res)
    expect(res.body.models[0].uuid).toBe(modelUuid)
  })

  test('that we can fetch all model by UUID', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/uuid/${modelUuid}`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(modelUuid)
  })

  test('that we can fetch all model by id', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/id/${modelId}`)
    validateTestRequest(res)
    expect(res.body.uuid).toBe(modelUuid)
  })

  test('that we can fetch deployments for a model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${modelUuid}/deployments`)
    validateTestRequest(res)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].uuid).toBe('test-deployment')
  })

  test('that we can fetch schema for model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${modelUuid}/schema`)
    validateTestRequest(res)
    expect(res.body.reference).toBe('test-schema')
  })

  test('that we can fetch versions for a model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${modelUuid}/versions`)
    validateTestRequest(res)
    expect(res.body.length).not.toBe(0)
    expect(res.body[0].version).toBe('1')
  })

  test('that we can fetch a specific version for a model', async () => {
    const res = await authenticatedGetRequest(`/api/v1/model/${modelUuid}/version/${'1'}`)
    validateTestRequest(res)
    expect(res.body).not.toBe(undefined)
    expect(res.body.version).toBe('1')
  })

  test('that we can delete a specific version for a model', async () => {
    const resDelete = await authenticatedDeleteRequest(`/api/v1/model/${modelUuid}`)
    validateTestRequest(resDelete)
    expect(resDelete.body).toBe(`${modelUuid}`)
    const resGet = await authenticatedGetRequest(`/api/v1/model/uuid/${modelUuid}`)
    expect(resGet.statusCode).toBe(404)
    expect(resGet.body.message).toBe(`Unable to find model '${modelUuid}'`)
  })

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})

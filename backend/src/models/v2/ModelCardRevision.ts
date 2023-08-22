import { Document, model, Schema } from 'mongoose'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ModelCardRevisionInterface {
  modelId: string
  schemaId: string

  version: number
  metadata: unknown

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ModelCardRevisionDoc = ModelCardRevisionInterface & Document<any, any, ModelCardRevisionInterface>

const ModelCardRevisionSchema = new Schema<ModelCardRevisionInterface>(
  {
    modelId: { type: String, required: true },
    schemaId: { type: String, required: true },

    version: { type: Number, required: true },
    metadata: { type: String, required: true, get: getSchema, set: setSchema },

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_model_card_revisions',
    toJSON: { getters: true },
  }
)

function getSchema(schema: string) {
  return JSON.parse(schema)
}

function setSchema(schema: unknown) {
  return JSON.stringify(schema)
}

const ModelCardRevisionModel = model<ModelCardRevisionInterface>('v2_Model_Card_Revision', ModelCardRevisionSchema)

export default ModelCardRevisionModel
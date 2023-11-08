import { merge } from 'lodash-es'

export function createUiSchema(schema: any, customSchema: any) {
  const baseUiSchema = createBaseSchema(schema)
  const uiSchema = merge(baseUiSchema, customSchema)

  return uiSchema
}

export function createBaseSchema(schema: any) {
  const uiSchema = {}

  if (schema.maxLength > 140) {
    uiSchema['ui:widget'] = 'textarea'
  }

  if (schema.widget) {
    uiSchema['ui:widget'] = schema.widget
  }

  if (schema.type === 'object') {
    for (const [property, value] of Object.entries(schema.properties)) {
      uiSchema[property] = createBaseSchema(value)
    }
  }

  if (schema.type === 'array') {
    for (const [arrayProperty, arrayValue] of Object.entries(schema.items)) {
      if (arrayProperty === 'type' && arrayValue === 'object') {
        for (const [property, value] of Object.entries(schema.items.properties)) {
          uiSchema['items'] = {}
          uiSchema['items'][property] = createBaseSchema(value)
        }
      }
    }
  }

  if (schema.type === 'boolean') {
    uiSchema['ui:widget'] = 'radio'
  }

  return uiSchema
}

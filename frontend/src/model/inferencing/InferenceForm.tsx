import { Slider, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ChangeEvent, useMemo, useState } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import ReadOnlyAnswer from 'src/Form/ReadOnlyAnswer'
import ProcessorTypeList from 'src/model/inferencing/ProcessorTypeList'
import ModelImageList from 'src/model/ModelImageList'
import { FlattenedModelImage, ModelInterface } from 'types/types'

type InferenceFormData = {
  image?: FlattenedModelImage
  description: string
  port: number
  processorType: string
  memory?: number
}

type EditableInferenceFormProps =
  | {
      editable: true
      isEdit: boolean
    }
  | {
      editable?: false
      isEdit?: false
    }

type InferenceFormProps = {
  model: ModelInterface
  formData: InferenceFormData
  onImageChange: (value: FlattenedModelImage) => void
  onDescriptionChange: (value: string) => void
  onPortChange: (value: number) => void
  onProcessorTypeChange: (value: string) => void
  onMemoryChange: (value: number) => void
} & EditableInferenceFormProps

export default function InferenceForm({
  model,
  formData,
  onImageChange,
  onDescriptionChange,
  onPortChange,
  onProcessorTypeChange,
  onMemoryChange,
  editable = false,
  isEdit = false,
}: InferenceFormProps) {
  const theme = useTheme()
  const isReadOnly = useMemo(() => editable && !isEdit, [editable, isEdit])
  const [cpuType, setCpuType] = useState(formData.processorType === 'cpu')

  const handleMemoryChange = (_event: Event, newValue: number | number[]) => {
    onMemoryChange(newValue as number)
  }

  const handleImageChange = (image: FlattenedModelImage) => {
    onImageChange(image)
  }

  const handlePortChange = (event: ChangeEvent<HTMLInputElement>) => {
    onPortChange(parseInt(event.target.value))
  }
  const handleProcessorTypeChange = (_event: ChangeEvent<HTMLInputElement>, newValue: string) => {
    onProcessorTypeChange(newValue)
    setCpuType(formData.processorType !== 'cpu')
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDescriptionChange(event.target.value)
  }
  return (
    <Stack spacing={2}>
      <Typography fontWeight='bold'>
        Description {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>
      {isReadOnly ? (
        <ReadOnlyAnswer value={formData.description} />
      ) : (
        <TextField required size='small' value={formData.description} onChange={handleDescriptionChange} />
      )}
      <Typography fontWeight='bold' color='primary' fontSize='medium'>
        Deployment Settings
        {!isReadOnly && <HelpPopover>These help you configure how your image is deployed within Bailo</HelpPopover>}
      </Typography>
      {!isReadOnly && !editable && (
        <>
          <Typography fontWeight='bold'>
            Image
            {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
          </Typography>
          <ModelImageList model={model} value={formData.image} onChange={handleImageChange} />
        </>
      )}
      <Typography fontWeight='bold'>
        Port {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>
      {isReadOnly ? (
        <ReadOnlyAnswer value={formData.port.toString()} />
      ) : (
        <TextField required size='small' value={formData.port} onChange={handlePortChange} type='number' />
      )}
      <Typography fontWeight='bold'>
        Processor Type {!isReadOnly && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>
      {isReadOnly ? (
        <ReadOnlyAnswer value={formData.processorType} />
      ) : (
        <ProcessorTypeList value={formData.processorType} onChange={handleProcessorTypeChange} readOnly={false} />
      )}
      <Typography fontWeight='bold'>
        {`Memory : ${formData.memory} GB `}
        {!isReadOnly && formData.processorType === 'cpu' && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>
      {!isReadOnly && (
        <Tooltip
          title='Specify a cpu processor type to allocate memory to this service'
          disableHoverListener={cpuType}
          disableFocusListener={cpuType}
        >
          <span>
            <Slider
              disabled={!cpuType}
              size='small'
              min={1}
              max={8}
              value={formData.memory}
              aria-label='Memory'
              getAriaValueText={(value: number) => `${value} GB`}
              onChange={handleMemoryChange}
              valueLabelDisplay='auto'
            />
          </span>
        </Tooltip>
      )}
    </Stack>
  )
}

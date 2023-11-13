import { Checkbox, FormControl, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { ChangeEvent, useMemo } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import ModelImageList from 'src/common/ModelImageList'
import MultiFileInput from 'src/common/MultiFileInput'
import RichTextEditor from 'src/common/RichTextEditor'
import ReadOnlyAnswer from 'src/Form/beta/ReadOnlyAnswer'
import { FlattenedModelImage } from 'types/interfaces'
import { ModelInterface } from 'types/v2/types'
import { isValidSemver } from 'utils/stringUtils'

type ReleaseFormData = {
  semver: string
  releaseNotes: string
  isMinorRelease: boolean
  artefacts: File[]
  imageList: FlattenedModelImage[]
}

type EditableReleaseFormProps =
  | {
      editable: true
      isEdit: boolean
    }
  | {
      editable?: false
      isEdit?: false
    }

type ReleaseFormProps = {
  model: ModelInterface
  formData: ReleaseFormData
  onSemverChange: (value: string) => void
  onReleaseNotesChange: (value: string) => void
  onMinorReleaseChange: (value: boolean) => void
  onArtefactsChange: (value: File[]) => void
  onImageListChange: (value: FlattenedModelImage[]) => void
} & EditableReleaseFormProps

export default function ReleaseForm({
  model,
  formData,
  onSemverChange,
  onReleaseNotesChange,
  onMinorReleaseChange,
  onArtefactsChange,
  onImageListChange,
  editable = false,
  isEdit = false,
}: ReleaseFormProps) {
  const isReadOnly = useMemo(() => editable && !isEdit, [editable, isEdit])

  const handleSemverChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSemverChange(event.target.value)
  }

  const handleMinorReleaseChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onMinorReleaseChange(checked)
  }

  const releaseNotesLabel = (
    <Typography component='label' fontWeight='bold' htmlFor={'new-model-description'}>
      Release Notes {!isReadOnly && <span style={{ color: 'red' }}>*</span>}
    </Typography>
  )

  return (
    <Stack spacing={2}>
      {!editable && (
        <Stack sx={{ width: '100%' }} justifyContent='center'>
          <Stack direction='row'>
            <Typography fontWeight='bold'>Release name</Typography>
            {!editable && (
              <HelpPopover>
                The release name is automatically generated using the model name and release semantic version
              </HelpPopover>
            )}
          </Stack>
          <Typography>{`${model.name} - ${formData.semver}`}</Typography>
        </Stack>
      )}
      <Stack>
        <Typography fontWeight='bold'>
          Semantic version {!editable && <span style={{ color: 'red' }}>*</span>}
        </Typography>
        {isReadOnly || isEdit ? (
          <ReadOnlyAnswer value={formData.semver} />
        ) : (
          <TextField
            required
            size='small'
            error={formData.semver !== '' && !isValidSemver(formData.semver)}
            helperText={formData.semver !== '' && !isValidSemver(formData.semver) ? 'Must follow format #.#.#' : ''}
            value={formData.semver}
            onChange={handleSemverChange}
          />
        )}
      </Stack>
      <Stack>
        {isReadOnly ? (
          <>
            {releaseNotesLabel}
            <MarkdownDisplay>{formData.releaseNotes}</MarkdownDisplay>
          </>
        ) : (
          <RichTextEditor
            value={formData.releaseNotes}
            onChange={onReleaseNotesChange}
            aria-label='Release notes'
            label={releaseNotesLabel}
          />
        )}
      </Stack>
      <Stack>
        {isReadOnly || isEdit ? (
          <>
            <Typography fontWeight='bold'>Minor Release</Typography>
            <ReadOnlyAnswer value={formData.isMinorRelease ? 'Yes' : 'No'} />
          </>
        ) : (
          <FormControl>
            <FormControlLabel
              control={<Checkbox size='small' checked={formData.isMinorRelease} onChange={handleMinorReleaseChange} />}
              label='Minor release - No significant changes, does not require release re-approval'
            />
          </FormControl>
        )}
      </Stack>
      <Stack>
        <Typography fontWeight='bold'>Artefacts</Typography>
        <MultiFileInput
          fullWidth
          disabled={isEdit} // TODO - Can be removed as part of BAI-1026
          label='Attach artefacts'
          files={formData.artefacts}
          readOnly={isReadOnly}
          onChange={onArtefactsChange}
        />
        {isReadOnly && formData.artefacts.length === 0 && <ReadOnlyAnswer value='No artefacts' />}
      </Stack>
      <Stack>
        <Typography fontWeight='bold'>Images</Typography>
        <ModelImageList model={model} value={formData.imageList} readOnly={isReadOnly} onChange={onImageListChange} />
        {isReadOnly && formData.imageList.length === 0 && <ReadOnlyAnswer value='No images' />}
      </Stack>
    </Stack>
  )
}
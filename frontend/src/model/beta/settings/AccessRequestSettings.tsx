import { LoadingButton } from '@mui/lab'
import { Checkbox, Stack, Typography } from '@mui/material'
import { useState } from 'react'

export default function AccessRequestSettings() {
  const [allowUngoverned, setAllowUngoverned] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)

    //TODO - Save settings API request and setLoading(false) on error
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        Manage access requests
      </Typography>
      <Stack direction='row' alignItems='center'>
        <Checkbox onChange={(event) => setAllowUngoverned(event.target.checked)} value={allowUngoverned} size='small' />
        <Typography>Allow users to make ungoverned access requests</Typography>
      </Stack>
      <div>
        <LoadingButton onClick={handleSave} loading={loading}>
          Save
        </LoadingButton>
      </div>
    </Stack>
  )
}

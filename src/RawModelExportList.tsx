import React from 'react'

import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'

import { useGetModelById, useGetModelVersions } from '../data/model'
import { Deployment } from '../types/interfaces'
import EmptyBlob from './common/EmptyBlob'
import Button from '@mui/material/Button'

const RawModelExportList = ({ deployment }: { deployment: Deployment }) => {
  const { model } = useGetModelById(deployment.model.toString())
  const { versions } = useGetModelVersions(model?.uuid)

  return (
    <>
      {versions &&
        versions.map((version: any) => {
          if (version.metadata?.buildOptions?.exportRawModel) {
            return (
              <Box key={version.version}>
                <Box sx={{ p: 1 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant='h4'>Version: {version.version}</Typography>
                  </Box>
                  <Stack spacing={2} direction='row' sx={{ p: 1 }}>
                    <Button
                      variant='contained'
                      href={`/api/v1/deployment/${deployment.uuid}/version/${version.version}/raw/code`}
                      target='_blank'
                    >
                      Download code file
                    </Button>
                    <Button
                      variant='contained'
                      href={`/api/v1/deployment/${deployment.uuid}/version/${version.version}/raw/binary`}
                      target='_blank'
                    >
                      Download binary file
                    </Button>
                  </Stack>
                </Box>
                <Divider orientation='horizontal' />
              </Box>
            )
          }
        })}
      {versions && versions.filter((e) => e.metadata.buildOptions?.exportRawModel).length === 0 && (
        <EmptyBlob text='No exportable versions' />
      )}
    </>
  )
}

export default RawModelExportList

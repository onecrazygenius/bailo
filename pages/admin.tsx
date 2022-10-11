import React, { ReactElement, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import { SelectChangeEvent } from '@mui/material/Select'
import Wrapper from '../src/Wrapper'
import FilterMenu from '../src/FilterMenu/FilterMenu'
import LogTree from '../src/LogTree/LogTree'
import isLogLevel, { isLogLevelString } from '../utils/type-guards/isLogLevel'
import { LogLevel } from '../types/interfaces'

export default function Admin(): ReactElement {
  const theme = useTheme()
  const [logLevel, setLogLevel] = useState<LogLevel>(LogLevel.TRACE)
  const [buildId, setBuildId] = useState('')
  const [requestId, setRequestId] = useState('')
  const [search, setSearch] = useState('')
  const [isRegex, setIsRegex] = useState(false)

  const handleLogLevelChange = (event: SelectChangeEvent<LogLevel>): void => {
    if (isLogLevel(event.target.value)) setLogLevel(event.target.value)
    else if (isLogLevelString(event.target.value)) setLogLevel(Number(event.target.value))
  }

  return (
    <Wrapper title='Admin' page='admin'>
      {/* TODO me - This dodgy height is probably causing the scrolling issue */}
      <Box display='flex' width='100%' height='calc(100vh - 196px)'>
        <Box flex={1} height='100%' overflow='auto'>
          <Box
            sx={{
              p: 1,
              height: '100%',
              backgroundColor: theme.palette.mode === 'light' ? '#f3f1f1' : '#5a5a5a',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 1,
            }}
          >
            <Box mx={1}>Logs</Box>
            <Divider sx={{ my: 1 }} />
            <Box mx={1} height='100%'>
              <Box display='flex' mb={1} width='100%'>
                <Box ml='auto'>
                  <FilterMenu
                    logLevel={logLevel}
                    onLogLevelChange={handleLogLevelChange}
                    buildId={buildId}
                    onBuildIdChange={(event): void => setBuildId(event.target.value)}
                    requestId={requestId}
                    onRequestIdChange={(event): void => setRequestId(event.target.value)}
                    search={search}
                    onSearchChange={(event): void => setSearch(event.target.value)}
                    isRegex={isRegex}
                    onIsRegexChange={(event): void => setIsRegex(event.target.checked)}
                  />
                  <Button variant='contained' size='small'>
                    Search
                  </Button>
                </Box>
              </Box>
              <Box mx={1} height='100%' overflow='auto'>
                <LogTree
                  logLevel={logLevel}
                  buildId={buildId}
                  requestId={requestId}
                  search={search}
                  isRegex={isRegex}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Wrapper>
  )
}

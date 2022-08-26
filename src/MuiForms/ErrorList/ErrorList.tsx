import ErrorIcon from '@mui/icons-material/Error'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ErrorListProps } from '@rjsf/core'
import React from 'react'

const ErrorList = ({ errors }: ErrorListProps) => (
  <Paper elevation={2} sx={{ display: 'none' }}>
    <Box mb={2} p={2}>
      <Typography variant='h6'>Errors</Typography>
      <List dense={true}>
        {errors.map((error, i: number) => {
          return (
            <ListItem key={i}>
              <ListItemIcon>
                <ErrorIcon color='error' />
              </ListItemIcon>
              <ListItemText primary={error.stack} />
            </ListItem>
          )
        })}
      </List>
    </Box>
  </Paper>
)

export default ErrorList

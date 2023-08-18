import { Autocomplete, Box, Button, List, ListItem, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import _ from 'lodash-es'
import { useEffect, useState } from 'react'

import { useListUsers } from '../../../../actions/user'
import { User } from '../../../../types/types'
import { CollaboratorEntry, ModelInterface } from '../../../../types/v2/types'
import Loading from '../../../common/Loading'
import EntityItem from './EntityItem'

type ModelAccessProps = {
  model: ModelInterface
}

export default function ModelAccess({ model }: ModelAccessProps) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<CollaboratorEntry[]>(model.collaborators)
  const { users, isUsersLoading } = useListUsers()

  const theme = useTheme()

  useEffect(() => {
    if (model) {
      setAccessList(model.collaborators)
    }
  }, [model, setAccessList])

  function onUserChange(_event: React.SyntheticEvent<Element, Event>, newValue: User | null) {
    if (
      newValue &&
      !accessList.find(({ entity }) => entity === `user:${newValue.id}` || entity === `group:${newValue.id}`)
    ) {
      const updatedAccessList = accessList
      const newAccess = { entity: `user:${newValue.id}`, roles: [] }
      updatedAccessList.push(newAccess)
      setAccessList(accessList)
    }
  }

  // TODO - add a request to update the model's collaborators field
  function updateAccessList() {
    console.log(accessList)
  }

  return (
    <>
      {isUsersLoading && <Loading />}
      {users && (
        <Box sx={{ width: '750px' }}>
          <Stack spacing={2}>
            <Typography variant='h6' component='h2'>
              Manage model access
            </Typography>
            <Autocomplete
              open={open}
              onOpen={() => {
                setOpen(true)
              }}
              onClose={() => {
                setOpen(false)
              }}
              // we might get a string or an object back
              isOptionEqualToValue={(option: User, value: User) => option.id === value.id}
              onChange={onUserChange}
              getOptionLabel={(option) => option.id}
              options={users}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Add a user or group to the model access list'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isUsersLoading && <Loading size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Box
              sx={{
                overflowY: 'auto',
                maxHeight: '400px',
                border: 'solid 1px',
                padding: '20px',
                borderRadius: 1,
                borderColor: theme.palette.primary.main,
              }}
            >
              <List disablePadding>
                {accessList.map((entity) => (
                  <ListItem key={entity.entity}>
                    <EntityItem entity={entity} accessList={accessList} setAccessList={setAccessList} />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Button aria-label='Save access list' onClick={updateAccessList}>
              Save
            </Button>
          </Stack>
        </Box>
      )}
    </>
  )
}

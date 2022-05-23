import { alpha, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, TextField, Toolbar, Tooltip, Typography } from "@mui/material"
import { Box } from "@mui/system"
import { DataGrid, GridCallbackDetails, GridColDef, GridRowParams, GridSelectionModel } from "@mui/x-data-grid"
import axios from "axios"
import React, { useContext, useEffect, useState } from "react"
import DashboardBase from "../components/DashboardBase"
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { UserContext } from "../context"

const Users = () => {
  const userContext = useContext(UserContext)
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState<string[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [refreshUser, setRefreshUser] = useState(true)
  const idRef = React.createRef<HTMLInputElement>()
  const nameRef = React.createRef<HTMLInputElement>()
  const passRef = React.createRef<HTMLInputElement>()

  useEffect(() => {
    const url = localStorage.getItem('server')
    axios.get(url + 'ebina/users/users').then((res) => {
      if (res.status === 200) { setUsers(res.data) }
    })
    setRefreshUser(false)
  }, [refreshUser])

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      flex: 0,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 5,
    },
    {
      field: 'created_at',
      headerName: 'Create Date',
      minWidth: 160,
      flex: 1,
    },
    {
      field: 'updated_at',
      headerName: 'Update Date',
      minWidth: 160,
      flex: 1,
    },
  ];
  return (
    <DashboardBase>
      <Box height='80vh'>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(selected.length > 0 && {
              bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
            }),
          }}>
          {selected.length > 0 ? (
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div">
              {selected.length} selected
            </Typography>
          ) : (
            <Typography
              id="tableTitle"
              sx={{ flex: '1 1 100%' }}
              variant="h6"
              component="div">
              Users
            </Typography>
          )}
          {selected.length > 0 ? (
            <Tooltip title="Delete">
              <IconButton onClick={() => { setDeleteDialogOpen(true) }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Create User">
              <IconButton onClick={() => setCreateDialogOpen(true)}>
                <PersonAddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20]}
          checkboxSelection
          onSelectionModelChange={(selectionModel: GridSelectionModel, details: GridCallbackDetails) => setSelected(selectionModel as string[])}
          isRowSelectable={((param: GridRowParams) => param.id !== userContext.user?.id)} />
        <Dialog open={createDialogOpen} onClose={(() => { setCreateDialogOpen(false) })}>
          <DialogTitle>Create User</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="normal"
              id="id"
              label="ID"
              type="id"
              inputRef={idRef}
              fullWidth
            />
            <TextField
              autoFocus
              margin="normal"
              id="name"
              label="Name"
              type="name"
              inputRef={nameRef}
              fullWidth
            />
            <TextField
              autoFocus
              margin="normal"
              id="pass"
              label="Pass"
              type="password"
              inputRef={passRef}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={(() => { setCreateDialogOpen(false) })}>Cancel</Button>
            <Button onClick={(() => {
              const user = { id: idRef.current?.value, name: nameRef.current?.value, pass: passRef.current?.value }
              const url = localStorage.getItem('server')
              axios.post(url + 'ebina/user/regist', user).then((res) => {
                if (res.status === 201) {
                  setCreateDialogOpen(false)
                  setRefreshUser(true)
                } else {
                  console.log(res.data)
                }
              })
            })}>Create</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={deleteDialogOpen} onClose={(() => { setDeleteDialogOpen(false) })}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography variant="h6">
              Delete?
            </Typography>
            {selected.map((item) => {
              return (
                <Typography key={item} color='red'>
                  {item}
                </Typography>
              )
            })}
          </DialogContent>
          <DialogActions>
            <Button onClick={(() => { setDeleteDialogOpen(false) })}>Cancel</Button>
            <Button onClick={(() => {
              const url = localStorage.getItem('server')
              axios.delete(url + 'ebina/users/users', { params: { ids: selected.join() } }).then((res) => {
                if (res.status === 202) {
                  setDeleteDialogOpen(false)
                  setRefreshUser(true)
                } else {
                  console.log(res.data)
                }
              })
            })}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardBase>
  )
}

export default Users

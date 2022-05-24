import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { Box } from "@mui/system"
import { alpha, IconButton, Toolbar, Tooltip, Typography } from "@mui/material"
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid"
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { UserContext } from "../context"
import CreateUserDialog from "../components/CreateUserDialog"
import DeleteUserDialog from "../DeleteUserDialog"

const Users = () => {
  const userContext = useContext(UserContext)
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState<string[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [refreshUser, setRefreshUser] = useState(true)

  useEffect(() => {
    const url = localStorage.getItem('server')
    axios.get(url + 'ebina/users/users').then((res) => {
      if (res.status === 200) { setUsers(res.data) }
    })
    setRefreshUser(false)
  }, [refreshUser])

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0, },
    { field: 'name', headerName: 'Name', minWidth: 100, flex: 5, },
    { field: 'created_at', headerName: 'Create Date', minWidth: 160, flex: 1, },
    { field: 'updated_at', headerName: 'Update Date', minWidth: 160, flex: 1, },
  ];
  const hasSelectItem = selected.length > 0
  return (
    <Box height='100%' display='flex' flexDirection='column'>
      <Toolbar
        sx={{
          pl: { sm: 2 }, pr: { xs: 1, sm: 1 },
          ...(hasSelectItem && { bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity) }),
        }}>
        {hasSelectItem ? (
          <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
            {selected.length} selected
          </Typography>
        ) : (
          <Typography id="tableTitle" sx={{ flex: '1 1 100%' }} variant="h6" component="div">
            Users
          </Typography>
        )}
        {hasSelectItem ? (
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
      <Box height={1}>
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={20}
          rowsPerPageOptions={[20]}
          checkboxSelection
          onSelectionModelChange={(selectionModel, details) => setSelected(selectionModel as string[])}
          isRowSelectable={((param: GridRowParams) => param.id !== userContext.user?.id)}
        />
      </Box>
      <CreateUserDialog open={createDialogOpen} onClose={() => { setCreateDialogOpen(false) }} onCreated={() => { setRefreshUser(true) }} />
      <DeleteUserDialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false) }} onCreated={() => { setRefreshUser(true) }} ids={selected} />
    </Box>
  )
}

export default Users

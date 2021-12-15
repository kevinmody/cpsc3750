import * as React from "react";
import { 
    List, 
    Datagrid, 
    TextField,
    Create,
    Edit,
    SimpleForm,
    TextInput,
    Show,
    SimpleShowLayout,
} from 'react-admin';
import GradesTable from './GradesTable';

export const StudentList = props => (
    <List {...props}>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <TextField source="name" />
        </Datagrid>
    </List>

);
export const StudentShow = (props) => (
    <Show {...props}>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField source="name" />
            <GradesTable source="grades"/>
        </SimpleShowLayout>
    </Show>
);

export const StudentEdit = props => (
    <Edit {...props}>
        <SimpleForm>
            <TextField source="id" />
            <TextInput source="name" />
        </SimpleForm>
    </Edit>
);

export const StudentCreate = props => (
    <Create {...props}>
        <SimpleForm>
            <TextInput source="id" />
            <TextInput source="name" />
        </SimpleForm>
    </Create>
);


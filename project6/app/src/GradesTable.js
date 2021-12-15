import * as React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const GradesTable = (props) => {
  const grades = props.record.grades || []
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }}aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Grade ID</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Grade</TableCell>
            <TableCell>Max</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {grades.map((grade) => (
            <TableRow 
              key={grade.id}
              sx={{ '&:last-child td, &:last-child th':{border: 0}}}
            >
              <TableCell component="th" scope="row">
                {grade.id}
              </TableCell>
              <TableCell>{grade.type}</TableCell>
              <TableCell>{grade.grade}</TableCell>
              <TableCell>{grade.max}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default GradesTable;
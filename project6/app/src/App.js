import * as React from "react";
import { fetchUtils, Admin, Resource } from 'react-admin';
import MyRestClient from './RestClient';
import {StudentList,StudentShow, StudentCreate, StudentEdit} from './Students';
import {GradeList, GradeCreate, GradeEdit} from './Grades';


const httpClient = (url, options = {}) => {
	if(!options.headers){
		options.headers = new Headers({Authorization: `Basic ${btoa("teacher:testing")}`});
	}else{
		options.headers.set('Authorization', `Basic ${btoa("teacher:testing")}`);
	}
	return fetchUtils.fetchJson(url, options);
};

const dataProvider = MyRestClient('../project5/', httpClient);
const App = () => ( 
	<Admin dataProvider={dataProvider}>
		<Resource name="students" edit={StudentEdit} show={StudentShow} list={StudentList} create={StudentCreate} />
  		<Resource name="grades" edit={GradeEdit} list={GradeList} create={GradeCreate} />
	</Admin>
);

export default App;

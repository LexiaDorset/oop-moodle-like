import { initializeApp } from 'firebase/app';

import {
    getFirestore, where,
    collection, query,
    getDocs
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDh4Hfogm5owW-g1PBv2ClffErwz7g88D8",
    authDomain: "poofinal-54e26.firebaseapp.com",
    projectId: "poofinal-54e26",
    storageBucket: "poofinal-54e26.appspot.com",
    messagingSenderId: "295749420687",
    appId: "1:295749420687:web:95abbe1f9ff4c0fc5d52fa"
};

// init firebase app
initializeApp(firebaseConfig)

// init services
export const db = getFirestore()

function addLeadingZero(number) {
    return number < 10 ? "0" + number : number;
}

export function formateDate(date) {
    const dateF = date.toDate();
    const year = addLeadingZero(dateF.getFullYear());
    const month = addLeadingZero(dateF.getMonth() + 1);
    const day = addLeadingZero(dateF.getDate());
    return `${day}/${month}/${year}`;
}

export function isSameDay(date1, date2) {
    var d1 = new Date(date1.getTime());
    d1.setHours(0, 0, 0, 0);

    var d2 = new Date(date2.getTime());
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
}


export function timeStampToDateLocal(date) {
    var year = date.getFullYear();
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);

    return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
}

export function timeStampToDate(date) {
    var year = date.getFullYear();
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + "-" + month + "-" + day;
}

// Usage




export function formateDateHours(date) {
    const dateF = date.toDate();
    const year = addLeadingZero(dateF.getFullYear());
    const month = addLeadingZero(dateF.getMonth() + 1);
    const day = addLeadingZero(dateF.getDate());
    const hours = addLeadingZero(dateF.getHours());
    const minutes = addLeadingZero(dateF.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Collections
export const examCollection = "exam";
export const moduleCollection = "module";
export const submissionCollection = "submission";
export const userCollection = "user";
export const usermoduleCollection = "usermodule";
export const courseCollection = "course";
export const teachermoduleCollection = "teachermodule";
export const gradesCollection = "grade";


// Collections references
export const examRef = collection(db, examCollection)
export const moduleRef = collection(db, moduleCollection)
export const submissionRef = collection(db, submissionCollection)
export const userRef = collection(db, userCollection)
export const usermoduleRef = collection(db, usermoduleCollection)
export const courseRef = collection(db, courseCollection)
export const teachermoduleRef = collection(db, teachermoduleCollection)
export const gradesRef = collection(db, gradesCollection)


// Modules
export const moduleNameString = "name";

// User
export const userName = "full_name";
export const userId = "user_id";
export const userRole = "role";
export const userEmail = "email";

// UserModule
export const usermoduleId = "module_id";
export const usermoduleUserId = "user_id";
export const usermoduleGrade = "grade";

// TeacherModule
export const teachermoduleId = "module_id";
export const teachermoduleUserId = "user_id";

// Courses
export const courseStartDate = "start_date";
export const courseEndDate = "end_date";
export const courseDescription = "description";
export const courseModule = "module_id";

// Grades
export const gradesUserId = "usermodule_id";
export const gradesGrade = "grade";
export const gradesExamId = "exam_id";

// Modules get values
export function getModuleName(data) {
    return data.name;
}
export function getModuleDescription(data) {
    return data.description;
}

// User get values
export function getUserName(data) {
    return data.full_name;
}
export function getUserId(data) {
    return data.id_user;
}
export function getUserRole(data) {
    return data.role;
}
export function getUserEmail(data) {
    return data.email;
}

// UserModule get values
export function getUserModuleId(data) {
    return data.module_id;
}
export function getUserModuleUserId(data) {
    return data.user_id;
}
export function getUserModuleGrade(data) {
    return data.grade;
}

// Courses get values
export function getCourseDescription(data) {
    return data.description;
}
export function getCourseModule(data) {
    return data.module_id;
}
export function getCourseStartDate(data) {
    return data.start_date;
}
export function getCourseEndDate(data) {
    return data.end_date;
}

// Exam get values
export function getExamModuleId(data) {
    return data.module_id;
}
export function getExamDate(data) {
    return data.date;
}
export function getExamName(data) {
    return data.name;
}
export function getExamDescription(data) {
    return data.description;
}

// Grades get values
export function getGradesUserId(data) {
    return data.user_id;
}
export function getGradesGrade(data) {
    return data.grade;
}
export function getGradesExamId(data) {
    return data.exam_id;
}
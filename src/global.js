import { initializeApp } from 'firebase/app';

import {
    getFirestore, where,
    collection, query,
    getDocs, deleteDoc, doc
} from 'firebase/firestore';
import {
    signOut
} from "firebase/auth";

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
export const userCollection = "user";
export const usermoduleCollection = "usermodule";
export const courseCollection = "course";
export const teachermoduleCollection = "teachermodule";
export const gradesCollection = "grade";


// Collections references
export const examRef = collection(db, examCollection)
export const moduleRef = collection(db, moduleCollection)
export const userRef = collection(db, userCollection)
export const usermoduleRef = collection(db, usermoduleCollection)
export const courseRef = collection(db, courseCollection)
export const gradesRef = collection(db, gradesCollection)


// Modules
export const moduleNameString = "name";
export const moduleDescriptionString = "description";
export const moduleFacultyIdString = "faculty_id";

// User
export const userName = "full_name";
export const userId = "user_id";
export const userRole = "role";
export const userEmail = "email";

// UserModule
export const usermoduleId = "module_id";
export const usermoduleUserId = "user_id";
export const usermoduleGrade = "grade";

// Courses
export const courseStartDate = "start_date";
export const courseEndDate = "end_date";
export const courseDescription = "description";
export const courseModule = "module_id";

// Grades
export const gradesUserId = "user_id";
export const gradesGrade = "grade";
export const gradesExamId = "exam_id";

// Roles
export const roleAdmin = "admin";
export const roleStudent = "student";
export const roleFaculty = "faculty";

// Grades
export const examModuleId = "module_id";
export const examDate = "date";
export const examName = "name";
export const examDescription = "description";

// Modules get values
export function getModuleName(data) {
    return data.name;
}
export function getModuleDescription(data) {
    return data.description;
}
export function getModuleFacultyId(data) {
    return data.faculty_id;
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


export function showCourses(doc1, doc2, link, name) {
    let a = document.createElement("a");
    a.classList.add("item-nav");
    a.href = link;
    a.innerText = name;
    doc1.insertBefore(a, doc2);
}

export function navButton(profile, userId, dropdownToggle, dropdown, buttonLogout, auth, role) {
    if (role) {
        profile.remove()
    }
    else {
        profile.addEventListener('click', () => {
            window.location.replace("./profile.html?id=" + userId);
        });
    }
    dropdownToggle.addEventListener('click', () => {
        dropdown.classList.toggle('hidden');
    });
    buttonLogout.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.replace("./login.html");
            console.log("User signed out");
        }).catch((error) => {
            console.error(error);
        });
    });
}


export function deleteModule(moduleId) {
    return new Promise((resolve, reject) => {
        deleteDoc(doc(moduleRef, moduleId))
            .then(() => {
                // Delete tous les users, exams et courses attachés °E°
                deleteModuleUserWithModuleId(moduleId).then(() => {
                    deleteCourseWithModuleId(moduleId).then(() => {
                        deleteExamWithModuleId(moduleId).then(() => {
                            console.log('Module deleted');
                            resolve();
                        });
                    });
                });
            })
            .catch((error) => {
                console.error('Error deleting Module:', error);
            });
    })
}

export function deleteCourse(courseId) {
    return new Promise((resolve, reject) => {
        deleteDoc(doc(courseRef, courseId))
            .then(() => {
                console.log('Course deleted');
                resolve();
            })
            .catch((error) => {
                console.error('Error deleting Course:', error);
            });
    })
}

export function deleteGrade(gradeId) {
    return new Promise((resolve, reject) => {
        deleteDoc(doc(gradesRef, gradeId))
            .then(() => {
                console.log('Grade deleted');
                resolve();
            })
            .catch((error) => {
                console.error('Error deleting Grade:', error);
            });
    })
}

export function deleteModuleUser(moduleId, userId) {
    return new Promise((resolve, reject) => {
        const q = query(usermoduleRef, where(usermoduleId, "==", moduleId), where(usermoduleUserId, "==", userId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref)
                    .then(() => {
                        const q2 = query(examRef, where(examModuleId, "==", moduleId));
                        getDocs(q2).then((querySnapshot2) => {
                            if (querySnapshot2.empty) {
                                resolve();
                            }
                            querySnapshot2.forEach((doc2) => {
                                deleteGradeWithExamIdUserId(userId, doc2.id).then(() => {
                                    resolve();
                                });
                            });
                        });
                        console.log('UserModule deleted');
                    })
                    .catch((error) => {
                        console.error('Error deleting UserModule:', error);
                    });
            });
        });
    })
}

export function deleteGradeWithExamIdUserId(userId, examId) {
    return new Promise((resolve, reject) => {
        const q = query(gradesRef, where(gradesUserId, "==", userId), where(gradesExamId, "==", examId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref)
                    .then(() => {
                        console.log('Grade deleted');
                        resolve();
                    })
                    .catch((error) => {
                        console.error('Error deleting Grade:', error);
                    });
            });
        });
    });
}

export function deleteModuleUserWithModuleId(moduleId) {
    return new Promise((resolve, reject) => {
        const q = query(usermoduleRef, where(usermoduleId, "==", moduleId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref)
                    .then(() => {
                        console.log('UserModule deleted');
                        resolve();
                    })
                    .catch((error) => {
                        console.error('Error deleting UserModule:', error);
                    });
            });
        });
    })
}
export function deleteExam(examId) {
    return new Promise((resolve, reject) => {
        deleteDoc(doc(examRef, examId))
            .then(() => {
                deleteGradeWithExamId(examId).then(() => {
                    console.log('Exam deleted');
                    resolve();
                });
            })
            .catch((error) => {
                console.error('Error deleting Exam:', error);
            });
    })
}

export function deleteExamWithModuleId(moduleId) {
    return new Promise((resolve, reject) => {
        const q = query(examRef, where(examModuleId, "==", moduleId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                let id = doc.id;
                deleteDoc(doc.ref)
                    .then(() => {
                        deleteGradeWithExamId(id).then(() => {
                            console.log('Exam deleted');
                            resolve();
                        });
                    })
                    .catch((error) => {
                        console.error('Error deleting Exam:', error);
                    });
            });
        });
    })
}

export function deleteCourseWithModuleId(moduleId) {
    return new Promise((resolve, reject) => {
        const q = query(courseRef, where("module_id", "==", moduleId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref)
                    .then(() => {
                        console.log('Course deleted');
                        resolve();
                    })
                    .catch((error) => {
                        console.error('Error deleting Course:', error);
                    });
            });
        });
    })
}

export function deleteGradeWithExamId(examId) {
    return new Promise((resolve, reject) => {
        const q = query(gradesRef, where(gradesExamId, "==", examId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref)
                    .then(() => {
                        console.log('Grade deleted');
                        resolve();
                    })
                    .catch((error) => {
                        console.error('Error deleting Grade:', error);
                    });
            });
        });
    })
}

export function deleteUser(userId) {
    return new Promise((resolve, reject) => {
        deleteDoc(doc(userRef, userId))
            .then(() => {
                deleteModuleUserWithUserId(userId).then(() => {
                    console.log('User deleted');
                    resolve();
                });
            })
            .catch((error) => {
                console.error('Error deleting User:', error);
            });
    })
}

export function deleteModuleUserWithUserId(userId) {
    return new Promise((resolve, reject) => {
        const q = query(usermoduleRef, where(usermoduleUserId, "==", userId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref)
                    .then(() => {
                        deleteGradeWithUserId(userId).then(() => {
                            console.log('UserModule deleted');
                            resolve();
                        });
                    })
                    .catch((error) => {
                        console.error('Error deleting UserModule:', error);
                    });
            });
        });
    })
}

export function deleteGradeWithUserId(userId) {
    return new Promise((resolve, reject) => {
        const q = query(gradesRef, where(gradesUserId, "==", userId));
        getDocs(q).then((querySnapshot) => {
            if (querySnapshot.empty) {
                resolve();
            }
            querySnapshot.forEach((doc) => {
                deleteDoc(doc.ref)
                    .then(() => {
                        console.log('Grade deleted');
                        resolve();
                    })
                    .catch((error) => {
                        console.error('Error deleting Grade:', error);
                    });
            });
        });
    })
}


export function datesDiff(a, b) {
    a = a.getTime();
    b = (b || new Date()).getTime();
    var c = a > b ? a : b,
        d = a > b ? b : a;
    return Math.abs(Math.ceil((c - d) / 86400000));
}

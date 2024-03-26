import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    deleteUser,
    onAuthStateChanged,
    signOut, sendPasswordResetEmail
} from "firebase/auth";
import {
    getFirestore, collection, onSnapshot,
    addDoc, deleteDoc, doc,
    query, where,
    orderBy, serverTimestamp,
    getDoc, child, get, Timestamp, updateDoc
} from 'firebase/firestore';

import * as global from "./global.js";

// Auth
const auth = getAuth();

let params = new URLSearchParams(window.location.search);
let moduleId = params.get('id');
let courseType = params.get('type');
console.log(moduleId);

console.log("course", courseType);
const module = doc(global.moduleRef, moduleId);

// Elements
const detailsModule = document.getElementById('details-module');
const detailsModuleAll = document.querySelector('.details-module');
const editCourseForm = document.querySelector('.edit-course');

const headModule = document.getElementById('head-module');

const listParticipants = document.getElementById('list-participants');

const courseButton = document.getElementById('course');
const listCourses = document.getElementById('list-courses');
const listExams = document.getElementById('list-exams');

const participantsButton = document.getElementById('participants');

participantsButton.href = "module.html" + "?id=" + moduleId + "&type=" + "participants";
courseButton.href = "module.html" + "?id=" + moduleId + "&type=" + "course";


// Forms
const formCreateCourse = document.querySelector('.add-course');
const formCreateExam = document.querySelector('.add-exam');


// *-------------------------------------------------------------------------------* //
// *-------------------------- Create a new course ----------------------------* //
// *-------------------------------------------------------------------------------* //
formCreateCourse.addEventListener('submit', (e) => {
    e.preventDefault();
    addDoc(global.courseRef, {
        module_id: moduleId,
        start_date: Timestamp.fromDate(new Date(formCreateCourse.start_date.value)),
        description: formCreateCourse.description.value,
        end_date: Timestamp.fromDate(new Date(formCreateCourse.end_date.value)),
    })
        .then(() => {
            console.log('Course added');
        })
        .catch((error) => {
            console.error('Error adding Course:', error);
        });
    formCreateCourse.reset();
    window.addCourse.close();
});

// *-------------------------------------------------------------------------------* //
// *-------------------------- Create a new exam ----------------------------* //
// *-------------------------------------------------------------------------------* //

formCreateExam.addEventListener('submit', (e) => {
    e.preventDefault();
    addDoc(global.examRef, {
        module_id: moduleId,
        name: formCreateExam.name.value,
        description: formCreateExam.description.value,
        date: Timestamp.fromDate(new Date(formCreateExam.date.value)),
    })
        .then(() => {
            console.log('Exam added');
        })
        .catch((error) => {
            console.error('Error adding Exam:', error);
        });
    formCreateExam.reset();
    window.addExam.close();
});




function addDetailsModule() {
    return new Promise((resolve, reject) => {
        let ul = document.createElement('ul');
        let li1 = document.createElement('li');
        let h1 = document.createElement('h1');
        let li3 = document.createElement('li');

        getDoc(module).then((docu) => {
            if (docu.exists()) {
                let docuData = docu.data();
                li1.innerText = "Module Title: " + global.getModuleName(docuData);
                document.title = "Course: " + global.getModuleName(docuData);
                h1.innerText = global.getModuleName(docuData);
                let teacher = doc(global.userRef, docuData.faculty_id);
                getDoc(teacher).then((teacherDoc) => {
                    if (teacherDoc.exists()) {
                        let teacherData = teacherDoc.data();
                        li3.innerText += "Teacher: " + global.getUserName(teacherData);
                    } else {
                        li3.innerText += "Teacher not found";
                    }
                    ul.append(li1, li3);
                    detailsModule.append(ul);
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            } else {
                h1.innerText = "Module not found";
                resolve();
            }
        }).catch((error) => {
            reject(error);
        });

        headModule.append(h1);
        addParticipants().then(() => {
            addUsers();
        });
        addCourses();
        addExams();
    });
}


// *-------------------------------------------------------------------------------* //
// *------------------------ Add participants course ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addParticipants() {
    return new Promise((resolve, reject) => {
        const userQuery = query(global.usermoduleRef, where(global.usermoduleId, '==', moduleId));
        onSnapshot(userQuery, (querySnapshot) => {
            let totalSize = querySnapshot.size;
            let count = 0;
            querySnapshot.forEach((docu) => {
                const ddata = docu.data();
                const userId = global.getUserModuleUserId(ddata);
                getDoc(doc(global.userRef, userId)).then((docu) => {
                    if (docu.exists()) {
                        let docuData = docu.data();
                        let tr = document.createElement('tr');
                        tr.id = userId + "parti";
                        let td = document.createElement('td');
                        let td2 = document.createElement('td');
                        let td3 = document.createElement('td');
                        let a = document.createElement('a');
                        a.innerText = global.getUserName(docuData);
                        td.append(a);
                        a.href = "profile.html?id=" + userId;
                        td2.innerText = global.getUserRole(docuData);
                        let gradeUser = global.getUserModuleGrade(ddata);
                        if (gradeUser == null) {
                            td3.innerText = "-"
                        } else { td3.innerText = gradeUser; }
                        tr.append(td, td3, td2);
                        listParticipants.appendChild(tr);
                        if (++count == totalSize) resolve();
                    } else {
                        console.log("No such document!");
                        reject();
                    }
                }).catch((error) => {
                    console.log("Error getting document:", error);

                    reject();
                });
            });
            if (count == totalSize) resolve();

        });
    });
}

function addCourses() {
    const courseQuery = query(global.courseRef, where(global.courseModule, '==', moduleId));
    onSnapshot(courseQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            if (document.getElementById(docu.id + "course")) {
                console.log("Course already exists");
                return;
            }
            const ddata = docu.data();
            let card = document.createElement('div');
            card.classList.add("card-course");
            let h4_1 = document.createElement('h4');
            let h4_2 = document.createElement('h4');
            let h3 = document.createElement('h3');
            let date = global.getCourseStartDate(ddata).toDate()
            let date2 = global.getCourseEndDate(ddata).toDate()
            // Usage
            if (global.isSameDay(date2, date)) {
                h3.innerText = date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) + ', ' + date.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                }) + " ► " + date.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            else {
                h3.innerText = date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) + ', ' + date.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                }) + " ► " + date2.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) + ', ' + date2.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            let div = document.createElement('div');
            div.addEventListener('click', () => {
                editDialogCourseUpdate(docu.id);
                window.editCourse.showModal();
            });
            div.innerHTML = `<i class="fas fa-edit"></i>`;
            div.classList.add("edit-module");

            h3.append(div);
            h4_2.innerText = "Description: " + global.getCourseDescription(ddata);
            card.append(h3, h4_1, h4_2);
            card.id = docu.id + "course";
            listCourses.appendChild(card);
        });
    });
}
const buttonDeleteCourse = document.getElementById('delete-course')
buttonDeleteCourse.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this course?") == false) return;
    deleteDoc(doc(global.courseRef, buttonDeleteCourse.id.slice(0, -7)))
        .then(() => {
            console.log('Course deleted');
        })
        .catch((error) => {
            console.error('Error deleting Course:', error);
        });
    window.editCourse.close();
});


// Usage

function editDialogCourseUpdate(key) {
    const courseQuery = doc(global.courseRef, key);
    getDoc(courseQuery).then((docu) => {
        if (docu.exists()) {
            const ddata = docu.data();
            buttonDeleteCourse.id = key + "dCourse";
            editCourseForm.start_date.value = global.timeStampToDateLocal(global.getCourseStartDate(ddata).toDate());
            editCourseForm.end_date.value = global.timeStampToDateLocal(global.getCourseEndDate(ddata).toDate());
            editCourseForm.description.value = global.getCourseDescription(ddata);
            editCourseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                updateDoc(courseQuery, {
                    start_date: Timestamp.fromDate(new Date(editCourseForm.start_date.value)),
                    end_date: Timestamp.fromDate(new Date(editCourseForm.end_date.value)),
                    description: editCourseForm.description.value,
                })
                    .then(() => {
                        console.log('Course updated');
                    })
                    .catch((error) => {
                        console.error('Error updating Course:', error);
                    });
                editCourseForm.reset();
            });
        } else {
            console.log("No such document!");
        }
    }
    ).catch((error) => {
        console.log("Error getting document:", error);
    });
}


function addExams() {
    const examQuery = query(global.examRef, where(global.courseModule, '==', moduleId));
    onSnapshot(examQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            if (document.getElementById(docu.id + "exam")) {
                return;
            }

            const ddata = docu.data();
            let card = document.createElement('div');
            card.classList.add("card-exam");
            let h4_1 = document.createElement('h4');
            let h4_2 = document.createElement('h4');
            let a = document.createElement('a');

            let date = global.getExamDate(ddata).toDate()
            h4_1.innerHTML = `<i class="icon fa fa-clock-o fa-fw "></i>` + date.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            a.innerHTML = `<i class="icon fa fa-graduation-cap fa-fw"></i>` + " " + global.getExamName(ddata);
            a.href = "exam.html?id=" + docu.id + "&type=exam";
            h4_2.innerHTML = `<i class="icon fa fa-align-left fa-fw "></i>` + " " + global.getExamDescription(ddata);
            card.append(a, h4_1, h4_2);
            card.id = docu.id + "exam";
            listExams.appendChild(card);
        });
    });
}

const selectUserAdd = document.getElementById('selectUserAdd');

const formAddParticipant = document.querySelector('.add-participant');

function addUsers() {
    const userQuery = query(global.userRef);
    onSnapshot(userQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            const ddata = docu.data();
            if (global.getUserRole(ddata) == "admin" || document.getElementById(docu.id + "parti") != null) {
                return;
            }
            else {
                addUserToSelect(global.getUserName(ddata), docu.id);
            }
        });
    });
}



// *-------------------------------------------------------------------------------* //
// *----------------- Add options user to Dialog Add User -----------------* //
// *-------------------------------------------------------------------------------* //

function addUserToSelect(name, key) {
    if (document.getElementById(key + "addU")) return;
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    option.id = key + "addU";
    selectUserAdd.appendChild(option);
}


formAddParticipant.addEventListener('submit', (e) => {
    e.preventDefault();
    if (selectUserAdd.selectedIndex == -1) return;
    let user = selectUserAdd.options[selectUserAdd.selectedIndex].id.slice(0, -4);
    addDoc(global.usermoduleRef, {
        module_id: moduleId,
        user_id: user,
    })
        .then(() => {
            console.log('User added to module');
        })
        .catch((error) => {
            console.error('Error adding User:', error);
        });
    formAddParticipant.reset();
    window.addParticipant.close();
});

// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //
// *----------------------- AUTHENTIFICATIONS -------------------------------* //
// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //


onAuthStateChanged(auth, (user) => {
    //AuthChanges(user);
    if (user == null) {
        window.location.replace("login.html");
        return;
    }
    else {
        const userQuery = query(global.userRef, where(global.userId, '==', user.uid));
        console.log("User logged in", user.uid);
        onSnapshot(userQuery, (querySnapshot) => {
            querySnapshot.forEach((docu) => {
                if (docu.data().role == "faculty") {
                    window.location.replace("../faculty/dashboard.html");
                }
                else if (docu.data().role == "student") {
                    window.location.replace("../user/dashboard.html");
                }
                else {
                    addDetailsModule().then(() => {
                        console.log("admin");
                        document.body.style.display = "block";
                        if (courseType == "participants") {
                            document.querySelector(".participants-page").style.display = "block";
                            participantsButton.classList.add("active");
                        }
                        else {
                            detailsModuleAll.style.display = "block";
                            document.querySelector(".container-exams").style.display = "block";
                            courseButton.classList.add("active");
                        }
                    }).catch((error) => {
                        console.error("Error adding module details:", error);
                    });
                }
            });
        }, (error) => {
            window.location.replace("login.html");
        });
    }
});



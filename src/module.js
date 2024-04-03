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
    getDoc, child, get, Timestamp, updateDoc, getDocs
} from 'firebase/firestore';

import * as global from "./global.js";

// Auth
const auth = getAuth();
let role = "";
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

const profile = document.getElementById('profile');

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
        let li2 = document.createElement('li');

        getDoc(module).then((docu) => {
            if (docu.exists()) {
                let docuData = docu.data();
                li1.innerHTML = "Module title: " + `<strong>` + global.getModuleName(docuData) + `</strong>`;
                document.title = "Course: " + global.getModuleName(docuData);
                h1.innerText = global.getModuleName(docuData);
                let teacher = doc(global.userRef, docuData.faculty_id);
                getDoc(teacher).then((teacherDoc) => {
                    if (teacherDoc.exists()) {
                        let teacherData = teacherDoc.data();
                        li3.innerHTML += "Lecturer name: " + `<strong>` + global.getUserName(teacherData) + `</strong>`;
                        li2.innerHTML = "Lecturer email: " + `<strong>` + global.getUserEmail(teacherData) + `</strong>`;
                    } else {
                        li3.innerHTML += "Teacher not found";
                        li2.innerHTML = "Email not found";
                    }
                    ul.append(li1, li3, li2);
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
                        if (document.getElementById(docu.id + "parti") != null) {
                            return;
                        }
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
                        if (role == global.roleAdmin || role == global.roleFaculty) {
                            let td4 = document.createElement('td');
                            let i = document.createElement('i');
                            i.classList.add("fas", "fa-trash-alt");
                            i.onclick = function () {
                                deleteParticipant(userId);
                            };
                            td4.append(i);
                            tr.append(td4);
                        }
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

function deleteParticipant(userId) {
    if (window.confirm("Are you sure you want to delete this user from this module?") == false) return;
    global.deleteModuleUser(moduleId, userId).then(() => {
        console.log('User module deleted');
        document.getElementById(userId + "parti").remove();
    }).catch((error) => {
        console.error('Error deleting Exam:', error);
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
            card.classList.add("card-object");
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
                }) + " ► " + date2.toLocaleTimeString('en-GB', {
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
            if (role == global.roleAdmin) {
                let divSup = document.createElement('div');
                let div = document.createElement('div');
                let div2 = document.createElement('div');
                div2.classList.add("delete-margin");
                div.addEventListener('click', () => {
                    editDialogCourseUpdate(docu.id);
                    window.editCourse.showModal();
                });
                div.innerHTML = `<i class="fas fa-edit button-object "></i>`;
                div2.innerHTML = `<i class="fas fa-trash-alt button-object"></i>`;
                div2.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.confirm("Are you sure you want to delete this course?") == false) return;
                    deleteDoc(doc(global.courseRef, docu.id))
                        .then(() => {
                            console.log('Course deleted');
                            document.getElementById(docu.id + "course").remove();
                        })
                        .catch((error) => {
                            console.error('Error deleting Course:', error);
                        });
                    window.editCourse.close();
                });
                divSup.classList.add("buttons-course");
                divSup.append(div, div2);
                h3.append(divSup);
            }

            h4_2.innerText = "Description: " + global.getCourseDescription(ddata);
            card.append(h3, h4_1, h4_2);
            card.id = docu.id + "course";
            listCourses.appendChild(card);
        });
    });
}


// Usage

function editDialogCourseUpdate(key) {
    const courseQuery = doc(global.courseRef, key);
    getDoc(courseQuery).then((docu) => {
        if (docu.exists()) {
            const ddata = docu.data();
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
            card.classList.add("card-object");
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
            let description = global.getExamDescription(ddata);
            if (description.length > 100) {
                description = description.substring(0, 100) + "...";
            }
            h4_2.innerHTML = `<i class="icon fa fa-align-left fa-fw "></i>` + " " + description;
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
            if (global.getUserRole(ddata) == global.roleFaculty) {
                addFacultyToSelect(global.getUserName(ddata), docu.id);
            }
            else if (global.getUserRole(ddata) == global.roleAdmin) {
                return;
            }
            if (document.getElementById(docu.id + "parti") != null) {
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
// *-------------------------- Add Faculty to Select ----------------------------* //
// *-------------------------------------------------------------------------------* //
let selectFaculty = document.getElementById('selectFaculty');

function addFacultyToSelect(name, key) {
    if (document.getElementById(key + "addF")) return;
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    option.id = key + "addF";
    selectFaculty.appendChild(option);
}

// *-------------------------------------------------------------------------------* //
// *-------------------------- Delete Module ----------------------------* //
// *-------------------------------------------------------------------------------* //



let editModuleForm = document.querySelector('.edit-module');

editModuleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    updateDoc(module, {
        name: editModuleForm.name.value,
        description: editModuleForm.description.value,
        faculty_id: selectFaculty.options[selectFaculty.selectedIndex].id.slice(0, -4),
    })
        .then(() => {
            console.log('Module updated');
        })
        .catch((error) => {
            console.error('Error updating Module:', error);
        });
    editModuleForm.reset();
    window.editModule.close();
});


// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Class to Select ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addClassSelect() {
    onSnapshot(global.classRef, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            if (document.getElementById(doc.id + "toC") != null) return;
            addClassToSelect(global.getClassName(doc.data()), doc.id);
        });
    });
}


let selectClass = document.getElementById('selectClassAdd');
function addClassToSelect(name, key) {
    if (document.getElementById(key + "addC")) return;
    const option = document.createElement("option");
    option.value = name;
    option.text = name;
    option.id = key + "addC";
    selectClass.appendChild(option);
}

let formAddClass = document.querySelector('.add-class');
formAddClass.addEventListener('submit', (e) => {
    e.preventDefault();
    if (selectClass.selectedIndex == -1) return;
    let classId = selectClass.options[selectClass.selectedIndex].id.slice(0, -4);
    addDoc(global.classmoduleRef, {
        class_id: classId,
        module_id: moduleId,
    })
        .then(() => {
            console.log('Class added to user');
            document.getElementById(classId + "addC").remove();
        })
        .catch((error) => {
            console.error('Error adding Class:', error);
        });
    formAddClass.reset();
    window.addClass.close();
});

let listClass = document.getElementById('list-class');

function addClass() {
    let classQuery = query(global.classmoduleRef, where(global.classModuleModuleId, '==', moduleId));
    onSnapshot(classQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            let classId = global.getClassModuleClassId(docu.data());
            getDoc(doc(global.classRef, classId)).then((docu2) => {
                if (document.getElementById(docu2.id + "toC") != null) return;
                /* if (document.getElementById(classId + "addM") != null) {
                     document.getElementById(classId + "addM").remove();
                     console.log("Suppression de l'option");
                 }*/
                const data2 = docu2.data();
                let a = document.createElement('a');
                a.innerText = global.getClassName(data2);
                let tr = document.createElement('tr');
                tr.id = docu2.id + "classL";
                let td1 = document.createElement('td');
                a.href = "class.html?id=" + docu2.id;
                td1.append(a);
                tr.append(td1);
                if (role == global.roleAdmin) {
                    let td4 = document.createElement('td');
                    let i = document.createElement('i');
                    i.classList.add("fas", "fa-trash-alt");
                    i.onclick = function () {
                        if (window.confirm("Are you sure you want to delete this class from this module?") == false) return;
                        deleteDoc(doc(global.classmoduleRef, docu.id)).then(() => {
                            console.log('Class deleted from module');
                            deleteUserFromModule(classId);
                            document.getElementById(classId + "toC").remove();
                            addClassToSelect(global.getClassName(data2), classId);
                        }).catch((error) => {
                            console.error('Error deleting Class:', error);
                        });
                    };
                    td4.append(i);
                    tr.append(td4);
                }
                addUserOfClass(docu2.id);
                tr.id = docu2.id + "toC";
                listClass.append(tr);
            });
        });
    });
}

function deleteUserFromModule(classId) {
    let userQuery = query(global.userclassRef, where(global.userClassClassId, '==', classId));
    getDocs(userQuery).then((querySnapshot) => {
        querySnapshot.forEach((docu) => {
            let userId2 = global.getUserClassUserId(docu.data());
            let userClassQuery = query(global.userclassRef, where(global.userClassUserId, '==', userId2));
            getDocs(userClassQuery).then((querySnapshot) => {
                let totalsize = querySnapshot.size;
                if (totalsize > 1) {
                    let count = 0;
                    querySnapshot.forEach((docu3) => {
                        count++;
                        if (docu3.id != docu.id) {
                            let classId2 = global.getUserClassClassId(docu3.data());
                            let classModuleQuery = query(global.classmoduleRef, where(global.classModuleClassId, '==', classId2), where(global.classModuleModuleId, '==', moduleId));
                            getDocs(classModuleQuery).then((querySnapshot) => {
                                if (querySnapshot.empty && count == totalsize) {
                                    global.deleteModuleUser(moduleId, userId2);
                                    document.getElementById(userId2 + "parti").remove();
                                    return;
                                }
                            });
                        }
                    });
                }
                else {
                    console.log("Suppression de l'utilisateur");
                    global.deleteModuleUser(moduleId, userId2);
                    document.getElementById(userId2 + "parti").remove();
                }
            });
        });
    }).catch((error) => {
        console.error('Error getting documents:', error);
    });
}

async function addUserOfClass(classId) {
    let userQuerye = query(global.userclassRef, where(global.userClassClassId, '==', classId));
    const querySnapshot = await getDocs(userQuerye);
    for (const docu of querySnapshot.docs) {
        let userId2 = global.getUserClassUserId(docu.data());
        let userModuleQuery = query(global.usermoduleRef, where(global.usermoduleId, '==', moduleId), where(global.usermoduleUserId, '==', userId2));
        const userModuleSnapshot = await getDocs(userModuleQuery);
        if (userModuleSnapshot.empty) {
            addDoc(global.usermoduleRef, {
                module_id: moduleId,
                user_id: userId2,
            }).then(() => {
                console.log('User added to module');
            }).catch((error) => {
                console.error('Error adding User:', error);
            });
        }
    }
}/*
function addUserOfClass(classId) {
    let userQuery = query(global.userclassRef, where(global.userClassClassId, '==', classId));
    onSnapshot(userQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            let userId2 = global.getUserClassUserId(docu.data());
            let userModuleQuery = query(global.usermoduleRef, where(global.usermoduleId, '==', moduleId), where(global.usermoduleUserId, '==', userId2));
            // Check if the user is already in the module
            onSnapshot(userModuleQuery, (querySnapshot) => {
                if (querySnapshot.size > 0) {
                    return;
                }
                else {
                    addDoc(global.usermoduleRef, {
                        module_id: moduleId,
                        user_id: userId2,
                    }).then(() => {
                        console.log('User added to module');
                    }).catch((error) => {
                        console.error('Error adding User:', error);
                    });
                }
            });
        });
    });
}*/


// *-------------------------------------------------------------------------------* //
// *-------------------------- Profile Redirection ----------------------------* //
// *-------------------------------------------------------------------------------* //

let userId = "null";


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
                userId = docu.id;

                role = docu.data().role;
                global.navButton(profile, userId, document.querySelector('.dropdown-toggle'), document.querySelector('.dropdown'), document.querySelector(".logout"), auth, role == global.roleAdmin);
                if (role == global.roleFaculty) {
                    global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", false);
                    //Check if the faculty id of the module is the same as the faculty id of the user
                    getDoc(module).then((docu) => {
                        if (docu.exists()) {
                            let docuData = docu.data();
                            if (docuData.faculty_id != userId) {
                                window.location.replace("dashboard.html");
                            }
                        }
                    });
                    console.log("faculty");
                }
                if (role == global.roleStudent) {
                    global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", false);
                    addDetailsModule().then(() => {
                        console.log("student");
                        document.body.style.display = "block";
                        addClass();
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
                else {
                    let div = document.createElement('div');
                    div.classList.add("div-button");
                    let button = document.createElement('button');
                    button.classList.add("buttonAddT");
                    button.onclick = function () {
                        window.addParticipant.showModal();
                    };
                    button.innerText = "Add a user";
                    let button2 = document.createElement('button');
                    button2.classList.add("buttonAddT");
                    button2.onclick = function () {
                        window.addClass.showModal();
                    };
                    button2.innerText = "Add a class";
                    div.append(button, button2);
                    document.querySelector(".participants-page").append(div);
                    let th = document.createElement('th');
                    th.innerText = "Delete";
                    document.getElementById("tr-users").append(th);

                    if (role == global.roleAdmin) {
                        document.getElementById("h2-general").innerHTML = `General<i class="fas fa-edit edit-object" id="editButtonModule"
                    onclick="window.editModule.showModal()"></i><i class="fas fa-trash-alt delete-object" id="delete-module"></i>`;
                        const buttonDeleteModule = document.getElementById('delete-module')
                        buttonDeleteModule.addEventListener('click', (e) => {
                            e.preventDefault();

                            if (window.confirm("Are you sure you want to delete this module?") == false) return;
                            global.deleteModule(moduleId).then(() => {
                                // Delete tous les users, exams et courses attachés °E°
                                console.log('Module deleted');
                                window.location.replace("./dashboard.html");
                            }).catch((error) => {
                                console.error('Error deleting Module:', error);
                            });
                        });
                        addClass();

                        let th2 = document.createElement('th');
                        th2.innerText = "Delete";
                        document.getElementById("tr-class").append(th2);
                    }



                    document.querySelector(".header-exam").innerHTML += `<div class="add-button" id="add-exam" onclick="window.addExam.showModal()"><i
                    class="fa fa-plus py-2 mr-3"></i></div>`
                    document.querySelector(".h-c").innerHTML += `<div class="add-button" id="add-course" onclick="window.addCourse.showModal()"> <i
                    class="fa fa-plus py-2 mr-3"></i></div>`
                    addDetailsModule().then(() => {
                        addClassSelect();

                        if (role == global.roleAdmin) {
                            let editModuleButton = document.getElementById('editButtonModule');
                            editModuleButton.addEventListener('click', () => {
                                onSnapshot(module, (docu2) => {
                                    if (docu2.exists()) {
                                        let docuData = docu2.data();
                                        editModuleForm.name.value = global.getModuleName(docuData);
                                        editModuleForm.description.value = global.getModuleDescription(docuData);
                                        document.getElementById(global.getModuleFacultyId(docuData) + "addF").selected = true;
                                    }
                                });
                            });
                        }

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



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
let role = null;

let params = new URLSearchParams(window.location.search);
let examId = params.get('id');
let courseType = params.get('type');
console.log(examId);
const exam = doc(global.examRef, examId);

const headExam = document.getElementById('head-exam');
const detailsExam = document.getElementById('details-exam');
const detailsExamPlus = document.getElementById('details-exam-plus');
const profile = document.getElementById('profile');

const listGrades = document.getElementById('list-grades');

const examButton = document.getElementById('exam');
const gradesButton = document.getElementById('grades');

const editExamForm = document.querySelector('.edit-exam');

gradesButton.href = "exam.html" + "?id=" + examId + "&type=" + "grades";
examButton.href = "exam.html" + "?id=" + examId + "&type=" + "exam";

let moduleId = null;

function addDetailsToExam() {
    return new Promise((resolve, reject) => {
        let ul = document.createElement('ul');
        let li1 = document.createElement('li');
        let h1 = document.createElement('h1');
        let li3 = document.createElement('li');
        let li2 = document.createElement('li');
        let h5 = document.createElement('h5');
        let a = document.createElement('a');
        let h12 = document.createElement('h1');

        getDoc(exam).then((docu) => {
            if (docu.exists()) {
                let docuData = docu.data();
                li1.innerHTML = "Exam title: " + `<strong>` + global.getExamName(docuData) + `</strong>`;
                li2.innerHTML = "Exam date: " + `<strong>` + global.getExamDate(docuData).toDate().toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) + `</strong>`;
                h5.innerText = global.getExamDescription(docuData);
                detailsExamPlus.append(h5);
                moduleId = global.getExamModuleId(docuData);
                let module = doc(global.moduleRef, moduleId);
                a.href = "module.html?id=" + moduleId;
                getDoc(module).then((moduleDoc) => {
                    if (moduleDoc.exists()) {
                        let moduleData = moduleDoc.data();
                        li3.innerHTML += "Module title: " + `<strong>` + global.getModuleName(moduleData) + `</strong>`;
                        h1.innerText = global.getModuleName(moduleData);
                        document.title = h1.innerText + ": " + global.getExamName(docuData);
                        h12.innerText = "/" + global.getExamName(docuData);
                    } else {
                        li3.innerHTML += "Module not found";
                    }
                    ul.append(li3, li1, li2);
                    detailsExam.append(ul);
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            } else {
                h1.innerText = "Exam not found";
                resolve();
            }
        }).catch((error) => {
            reject(error);
        });
        a.append(h1);
        headExam.append(a, h12);
    });
}


editExamForm.addEventListener('submit', (e) => {
    e.preventDefault();

    updateDoc(exam, {
        name: editExamForm.name.value,
        description: editExamForm.description.value,
        date: Timestamp.fromDate(editExamForm.date.value.toDate()),
    }).then(() => {
        console.log("Document successfully updated!");
        window.editExam.close();
    }).catch((error) => {
        console.error("Error updating document: ", error);
    });
});


// *-------------------------------------------------------------------------------* //
// *------------------------ Add grades exam ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addGrades() {
    const userQuery = query(global.usermoduleRef, where(global.usermoduleId, '==', moduleId));
    console.log("User module", moduleId);
    onSnapshot(userQuery, (querySnapshot) => {
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
                    let grade = "";
                    const gradeQuery = query(global.gradesRef, where(global.gradesExamId, '==', examId), where(global.gradesUserId, '==', userId));
                    let gradeId = null;
                    onSnapshot(gradeQuery, (querySnapshot) => {
                        if (querySnapshot.empty) {
                            td3.innerText = "-";
                            grade = "";
                        }
                        querySnapshot.forEach((docu) => {
                            grade = global.getGradesGrade(docu.data());
                            td3.innerText = grade;
                            gradeId = docu.id;
                        });
                    });
                    tr.append(td, td3, td2);
                    if (role == global.roleAdmin || role == global.roleFaculty) {
                        let td4 = document.createElement('td');
                        let i = document.createElement('i');
                        i.classList.add("fas", "fa-edit");
                        i.onclick = function () {
                            window.editGrade.showModal();
                            editGradeForm.grade.value = grade;
                            editGradeForm.grade.id = userId;
                        };
                        td4.append(i);
                        tr.append(td4);
                    }
                    listGrades.appendChild(tr);
                } else {
                    console.log("No such document!");
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });
        });
    });

}

let editGradeForm = document.querySelector('.edit-grade');
editGradeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const gradeQuery = query(global.gradesRef, where(global.gradesExamId, '==', examId), where(global.gradesUserId, '==', editGradeForm.grade.id));
    let gradeU = editGradeForm.grade.value;
    if (gradeU < 0 || gradeU > 20) {
        gradeU = "";
    }
    if (gradeU == "") {
        getDocs(gradeQuery)
            .then((querySnapshot) => {
                querySnapshot.forEach((docu) => {
                    let id = docu.id;
                    deleteDoc(docu.ref)
                        .then(() => {
                            window.editGrade.close();
                            console.log("Grade successfully deleted!");
                        })
                        .catch((error) => {
                            console.error("Error deleting document: ", error);
                        });
                });
            }).catch((error) => {
                console.error("Error getting documents: ", error);
            });
        window.editGrade.close();

    }
    else {
        getDocs(gradeQuery).then((querySnapshot) => {
            if (querySnapshot.empty) {
                addDoc(global.gradesRef, {
                    exam_id: examId,
                    user_id: editGradeForm.grade.id,
                    grade: editGradeForm.grade.value
                }).then(() => {
                    console.log("Grade successfully added!");
                    window.editGrade.close();
                }).catch((error) => {
                    console.error("Error updating document: ", error);
                });
            }
            querySnapshot.forEach((docu) => {
                updateDoc(docu.ref, {
                    grade: editGradeForm.grade.value
                }).then(() => {
                    console.log("Grade successfully updated!");
                    window.editGrade.close();
                }).catch((error) => {
                    console.error("Error updating document: ", error);
                });
            });
        }).catch((error) => {
            console.error("Error getting documents: ", error);
        });
    }
    editExamForm.reset();
});

// *-------------------------------------------------------------------------------* //
// *-------------------------- Profile Redirection ----------------------------* //
// *-------------------------------------------------------------------------------* //

let userId = "null";


// *-------------------------------------------------------------------------------* //
// *-------------------------- AUTHENTIFICATIONS ----------------------------* //
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
                role = global.getUserRole(docu.data());
                global.navButton(profile, userId, document.querySelector('.dropdown-toggle'), document.querySelector('.dropdown'), document.querySelector(".logout"), auth, role == global.roleAdmin);
                if (role == global.roleFaculty) {
                    global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", false);
                    // Check if the faculty id of the module is the same as the faculty id of the user
                    getDoc(exam).then((docu5) => {
                        if (docu5.exists()) {
                            let moduleId = global.getExamModuleId(docu5.data());
                            getDoc(doc(global.moduleRef, moduleId)).then((moduleDoc) => {
                                if (moduleDoc.exists()) {
                                    if (global.getModuleFacultyId(moduleDoc.data()) != userId) {
                                        window.location.replace("dashboard.html");
                                    }
                                }
                            });
                        }
                    });
                }
                if (role == global.roleStudent) {
                    global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", false);
                    addDetailsToExam().then(() => {
                        addGrades();
                        console.log("student");
                        document.body.style.display = "block";
                        if (courseType == "exam") {
                            document.querySelector(".details-exam").style.display = "block";
                            examButton.classList.add("active");
                        }
                        else {
                            document.querySelector(".table-wrapper").style.display = "block";
                            gradesButton.classList.add("active");
                        }
                    }).catch((error) => {
                        console.error("Error adding module details:", error);
                    });
                }
                else {
                    let th = document.createElement('th');
                    th.innerText = "Edit";
                    document.getElementById("tr-users").append(th);

                    document.getElementById("h2-general").innerHTML = `General<i class="fas fa-edit edit-object" id="editButtonExam"
                    onclick="window.editExam.showModal()"></i><i class="fas fa-trash-alt delete-object" id="delete-exam"></i>`;
                    let buttonDeleteExam = document.getElementById('delete-exam');
                    let editExamButton = document.getElementById('editButtonExam');
                    editExamButton.addEventListener('click', () => {
                        onSnapshot(exam, (docu) => {
                            if (docu.exists()) {
                                let docuData = docu.data();
                                editExamForm.name.value = global.getExamName(docuData);
                                editExamForm.description.value = global.getExamDescription(docuData);
                                editExamForm.date.value = global.timeStampToDate(new Date(global.getExamDate(docuData).toDate()));
                            }
                        });
                    });

                    buttonDeleteExam.addEventListener('click', (e) => {
                        e.preventDefault();

                        if (window.confirm("Are you sure you want to delete this exam?") == false) return;
                        global.deleteExam(examId).then(() => {
                            console.log('Course deleted');
                            window.location.replace("module.html?id=" + moduleId);
                        }).catch((error) => {
                            console.error('Error deleting Exam:', error);
                        });
                    });

                    addDetailsToExam().then(() => {
                        addGrades();
                        console.log("admin");
                        document.body.style.display = "block";
                        if (courseType == "exam") {
                            document.querySelector(".details-exam").style.display = "block";
                            examButton.classList.add("active");
                        }
                        else {
                            document.querySelector(".table-wrapper").style.display = "block";
                            gradesButton.classList.add("active");
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

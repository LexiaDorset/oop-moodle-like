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
let examId = params.get('id');
let courseType = params.get('type');
console.log(examId);
const exam = doc(global.examRef, examId);

const headExam = document.getElementById('head-exam');
const detailsExam = document.getElementById('details-exam');
const detailsExamPlus = document.getElementById('details-exam-plus');
const profile = document.getElementById('profile');

const dropdownToggle = document.querySelector('.dropdown-toggle');
dropdownToggle.addEventListener('click', () => {
    const dropdownMenu = document.querySelector('.dropdown');
    dropdownMenu.classList.toggle('hidden');
});
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

        let h5 = document.createElement('h5');

        getDoc(exam).then((docu) => {
            if (docu.exists()) {
                let docuData = docu.data();
                li1.innerText = "Exam Title: " + global.getExamName(docuData);
                document.title = "Exam: " + global.getExamName(docuData);
                h5.innerText = global.getExamDescription(docuData);
                detailsExamPlus.append(h5);
                moduleId = global.getExamModuleId(docuData);
                let module = doc(global.moduleRef, moduleId);
                getDoc(module).then((moduleDoc) => {
                    if (moduleDoc.exists()) {
                        let moduleData = moduleDoc.data();
                        li3.innerText += "Module: " + global.getModuleName(moduleData);
                        h1.innerText = global.getModuleName(moduleData) + "/" + global.getExamName(docuData);

                    } else {
                        li3.innerText += "Module not found";
                    }
                    ul.append(li3, li1);
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

        headExam.append(h1);
        addGrades();
    });
}

const buttonDeleteExam = document.getElementById('delete-exam')
buttonDeleteExam.addEventListener('click', (e) => {
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this exam?") == false) return;
    deleteDoc(doc(global.examRef, examId))
        .then(() => {
            console.log('Course deleted');
            window.location.replace("module.html?id=" + moduleId);
        })
        .catch((error) => {
            console.error('Error deleting Course:', error);
        });
    window.editCourse.close();

});


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
    const gradeQuery = query(global.gradesRef, where(global.gradesExamId, '==', examId));
    onSnapshot(gradeQuery, (querySnapshot) => {
        querySnapshot.forEach((docu) => {
            const ddata = docu.data();
            const userId = global.getGradesUserId(ddata);
            console.log("first");
            getDoc(doc(global.userRef, userId)).then((docu) => {
                if (docu.exists()) {
                    let docuData = docu.data();
                    let tr = document.createElement('tr');
                    let td = document.createElement('td');
                    let td2 = document.createElement('td');
                    let td3 = document.createElement('td');
                    td.innerText = global.getUserName(docuData);
                    td3.innerText = global.getUserRole(docuData);
                    td2.innerText = global.getGradesGrade(ddata);
                    tr.append(td, td2, td3);
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


// *-------------------------------------------------------------------------------* //
// *-------------------------- Profile Redirection ----------------------------* //
// *-------------------------------------------------------------------------------* //

let userId = "null";

profile.addEventListener('click', () => {
    console.log("Profile clicked");

    window.location.replace("./profile.html?id=" + userId);
});


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
                if (docu.data().role == "faculty") {
                    window.location.replace("../dashboard.html");
                }
                else if (docu.data().role == "student") {
                    addDetailsToExam().then(() => {
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
                else {
                    document.getElementById("h2-general").innerHTML = `General<i class="fas fa-edit edit-exam-i" id="editButtonExam"
                    onclick="window.editExam.showModal()"></i>`;
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
                    addDetailsToExam().then(() => {
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

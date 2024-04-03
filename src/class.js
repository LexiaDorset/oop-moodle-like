import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  deleteUser,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  child,
  get,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import * as global from "./global.js";

// Auth
const auth = getAuth();

let userId = "userId";
let user = auth.currentUser;
let role = "role";

let params = new URLSearchParams(window.location.search);
let classId = params.get("id");
console.log(classId);
const classProfile = doc(global.classRef, classId);
const profile = document.getElementById("profile");

const headProfile = document.getElementById("h2-profile");

const listParticipants = document.getElementById("list-participants");

let editClassForm = document.querySelector(".edit-class");

function addClassDetails() {
  let userR = doc(global.classRef, classId);

  getDoc(userR)
    .then((docu) => {
      if (docu.exists()) {
        const ddata = docu.data();
        let h1 = document.createElement("h1");
        h1.innerText = global.getClassName(ddata);
        editClassForm.name.value = h1.innerText;
        document.title = "Class: " + global.getClassName(ddata);
        headProfile.append(h1);
      } else {
        console.log("No such document!");
      }
    })
    .catch((error) => {
      console.log("Error getting document:", error);
    });
}

// *-------------------------------------------------------------------------------* //
// *------------------------ Add student of the class ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addParticipants() {
  console.log("Adding participants");
  return new Promise((resolve, reject) => {
    const userQuery = query(
      global.userclassRef,
      where(global.userClassClassId, "==", classId)
    );
    onSnapshot(userQuery, (querySnapshot) => {
      let totalSize = querySnapshot.size;
      let count = 0;
      querySnapshot.forEach((docu) => {
        const ddata = docu.data();
        const userId = global.getUserClassUserId(ddata);
        getDoc(doc(global.userRef, userId))
          .then((docu) => {
            if (docu.exists()) {
              if (document.getElementById(docu.id + "parti") != null) {
                return;
              }
              let docuData = docu.data();
              let tr = document.createElement("tr");
              tr.id = userId + "parti";
              let td = document.createElement("td");
              let td2 = document.createElement("td");
              let a = document.createElement("a");
              a.innerText = global.getUserName(docuData);
              td.append(a);
              a.href = "profile.html?id=" + userId;
              td2.innerText = global.getUserRole(docuData);
              tr.append(td, td2);
              if (role == global.roleAdmin) {
                let td4 = document.createElement("td");
                let i = document.createElement("i");
                i.classList.add("fas", "fa-trash-alt");
                i.onclick = function () {
                  deleteParticipant(userId, global.getUserName(docuData));
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
          })
          .catch((error) => {
            console.log("Error getting document:", error);

            reject();
          });
      });
      if (count == totalSize) resolve();
    });
  });
}

function deleteParticipant(userId, name) {
  if (window.confirm("Are you sure you want to delete this user from this class?") == false) return;
  global.deleteClassUser(classId, userId).then(() => {
    console.log("User class deleted");
    document.getElementById(userId + "parti").remove();
    addUserToSelect(name, userId);
  })
    .catch((error) => {
      console.error("Error deleting Exam:", error);
    });
}

function addUserToList() {
  onSnapshot(global.userRef, (querySnapshot) => {
    querySnapshot.forEach((docu) => {
      const ddata = docu.data();
      if (document.getElementById(docu.id + "parti") != null) {
        return;
      }
      if (global.getUserRole(ddata) != global.roleStudent) return;
      addUserToSelect(global.getUserName(ddata), docu.id);
      console.log("User added to select List");
    });
  });
}

let selectUser = document.getElementById("selectUser");
let addParticipantForm = document.querySelector(".add-participant");

addParticipantForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let userId = selectUser.options[selectUser.selectedIndex].id.slice(0, -4);
  addDoc(global.userclassRef, {
    [global.userClassClassId]: classId,
    [global.userClassUserId]: userId,
  }).then(() => {
    document.getElementById(userId + "addF").remove();
  });
  window.addParticipant.close();
});

// *-------------------------------------------------------------------------------* //
// *-------------------------- Add Users to Select ----------------------------* //
// *-------------------------------------------------------------------------------* //

function addUserToSelect(name, key) {
  if (document.getElementById(key + "addF")) return;
  const option = document.createElement("option");
  option.value = name;
  option.text = name;
  option.id = key + "addF";
  selectUser.appendChild(option);
}



editClassForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = editClassForm.name.value;
  updateDoc(classProfile, {
    [global.className]: name,
  }).then(() => {
    console.log("Document successfully updated!");
    window.location.reload();
  });
});

// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //
// *----------------------- AUTHENTIFICATIONS -------------------------------* //
// *-------------------------------------------------------------------------------* //
// *-------------------------------------------------------------------------------* //

onAuthStateChanged(auth, (_user) => {
  //AuthChanges(user);
  if (_user == null) {
    window.location.replace("login.html");
    return;
  } else {
    user = _user;
    const userQuery = query(
      global.userRef,
      where(global.userId, "==", _user.uid)
    );
    console.log("User logged in", _user.uid);
    onSnapshot(
      userQuery,
      (querySnapshot) => {
        querySnapshot.forEach((docu) => {
          role = global.getUserRole(docu.data());

          addClassDetails();
          addParticipants().then(() => {
            document.body.style.display = "block";

            if (role == global.roleAdmin) {
              global.navButton(profile, docu.id, document.querySelector(".dropdown-toggle"), document.querySelector(".dropdown"), document.querySelector(".logout"), auth, true);
              let button = document.createElement("button");
              button.classList.add("buttonAdd");
              button.onclick = function () {
                window.addParticipant.showModal();
              };
              button.innerText = "Add a user";
              document.querySelector(".participants-page").append(button);

              let th = document.createElement("th");
              th.innerText = "Delete";
              document.getElementById("tr-users").append(th);

              let editUserButton = document.createElement("i");
              editUserButton.classList.add("fas", "fa-edit", "edit-object");
              editUserButton.onclick = function () {
                window.editClass.showModal();
              };
              editUserButton.id = "edit-class";
              headProfile.append(editUserButton);

              let i = document.createElement("i");
              i.classList.add("fas", "fa-trash-alt", "delete-object");
              i.id = "delete-class";
              headProfile.append(i);
              i.addEventListener("click", (e) => {
                e.preventDefault();

                if (window.confirm("Are you sure you want to delete this class?") == false) return;
                global.deleteClass(classId).then(() => {
                  console.log("Class deleted finish");
                  window.location.replace("./dashboard.html");
                })
                  .catch((error) => {
                    console.error("Error deleting Module:", error);
                  });
              });
              addUserToList();
            }
            else {
              global.navButton(profile, docu.id, document.querySelector(".dropdown-toggle"), document.querySelector(".dropdown"), document.querySelector(".logout"), auth, false);
              global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", true);
            }
          });

          userId = docu.id;
        });
      },
      (error) => {
        window.location.replace("login.html");
      }
    );
  }
});

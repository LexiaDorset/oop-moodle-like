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

//*-------------------------------------------------------------------------------* //
// *-------------------------- Add Module to List -------------------------------* //
// *-------------------------------------------------------------------------------* //

function addModules() {
  return new Promise((resolve, reject) => {
    const userQuery = query(
      global.classmoduleRef,
      where(global.classModuleClassId, "==", classId)
    );
    onSnapshot(userQuery, (querySnapshot) => {
      if (querySnapshot.size == 0) resolve();
      let totalSize = querySnapshot.size;
      let count = 0;
      querySnapshot.forEach((docu) => {
        const ddata = docu.data();
        const moduleId = global.getClassModuleModuleId(ddata);
        getDoc(doc(global.moduleRef, moduleId)).then((docu) => {
          if (docu.exists()) {
            if (document.getElementById(moduleId + "module") != null) return;
            const ddata = docu.data();
            let tr = document.createElement("tr");
            tr.id = moduleId + "module";
            let td = document.createElement("td");
            let a = document.createElement("a");
            a.innerText = global.getModuleName(ddata);
            a.href = "module.html?id=" + moduleId;
            td.append(a);
            tr.append(td);
            if (role == global.roleAdmin) {
              let td2 = document.createElement("td");
              let i = document.createElement("i");
              i.classList.add("fas", "fa-trash-alt");
              i.onclick = function () {
                deleteModule(moduleId, global.getModuleName(ddata));
              };
              td2.append(i);
              tr.append(td2);
            }
            document.getElementById("list-modules").appendChild(tr);
            if (++count == totalSize) resolve();
          } else {
            console.log("No such document!");
            if (++count == totalSize) resolve();
          }
        });
      });
    });
  });
}

function deleteModule(moduleId, name) {
  if (window.confirm("Are you sure you want to delete this module from this class?") == false) return;
  global.deleteClassModuleWithClassIdModuleId(classId, moduleId).then(() => {
    console.log("Module class deleted");
    document.getElementById(moduleId + "module").remove();
    addModuleToSelect(name, moduleId);
  })
    .catch((error) => {
      console.error("Error deleting Module:", error);
    });
}

// *-------------------------------------------------------------------------------* //
// *---------------------------- Add Module To Select --------------------------------* //
// *-------------------------------------------------------------------------------* //

function addModulesSelect() {
  onSnapshot(global.moduleRef, (querySnapshot) => {
    querySnapshot.forEach((docu) => {
      if (document.getElementById(docu.id + "addM") || document.getElementById(docu.id + "module")) return;
      getDoc(doc(global.moduleRef, docu.id)).then((docu) => {
        addModuleToSelect(global.getModuleName(docu.data()), docu.id);
      });
    });
  });
}
let selectModule = document.getElementById("selectModuleAdd");

function addModuleToSelect(name, key) {
  if (document.getElementById(key + "addM")) return;
  const option = document.createElement("option");
  option.value = name;
  option.text = name;
  option.id = key + "addM";
  selectModule.appendChild(option);
}


// *-------------------------------------------------------------------------------* //
// *------------------------------ Add Module Form --------------------------------* //
// *-------------------------------------------------------------------------------* //
let addModuleForm = document.querySelector(".add-module");
addModuleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (selectModule.selectedIndex == -1) return;
  let moduleId = selectModule.options[selectModule.selectedIndex].id.slice(0, -4);
  addDoc(global.classmoduleRef, {
    [global.classModuleClassId]: classId,
    [global.classModuleModuleId]: moduleId,
  }).then(() => {
    console.log("Document successfully written!");
    window.addModule.close();
    document.getElementById(moduleId + "addM").remove();
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
              let div = document.createElement('div');
              div.classList.add("div-button");
              let button = document.createElement("button");
              button.classList.add("buttonAddT");
              button.onclick = function () {
                window.addParticipant.showModal();
              };
              button.innerText = "Add a user";
              let button2 = document.createElement("button");
              button2.classList.add("buttonAddT");
              button2.onclick = function () {
                window.addModule.showModal();
              };
              button2.innerText = "Add a module";
              div.append(button, button2);
              document.querySelector(".participants-page").append(div);

              let th = document.createElement("th");
              th.innerText = "Delete";
              document.getElementById("tr-users").append(th);

              let th2 = document.createElement('th');
              th2.innerText = "Delete";
              document.getElementById("tr-modules").append(th2);


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
              addModules().then(() => {
                addModulesSelect();
              });
            }
            else {
              global.navButton(profile, docu.id, document.querySelector(".dropdown-toggle"), document.querySelector(".dropdown"), document.querySelector(".logout"), auth, false);
              global.showCourses(document.querySelector(".nav-extend"), document.querySelector(".toggle-all"), "./courses.html", "My Courses", true);
              addModules();
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

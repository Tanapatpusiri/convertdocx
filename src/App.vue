<script setup>
import { ref } from 'vue';

const cvData = ref(null);
const progress = ref(0);
const showprogress = ref(false);
const progressColor = ref('#4caf50'); // Green by default
const downloadButtonColor = ref('#ccc');
const uploadCV = async (event) => {
  handleFileChange();
  showprogress.value = true;
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append('cvFile', file);

  try {
    const response = await fetch('https://convertdocx.onrender.com/api/uploadCV', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error(error);
  }
};

const updateProgress = () => {
  if (progress.value < 100) {
    progress.value += 10;
    
    if (progress.value >= 100) {
      downloadButtonColor.value = '#4caf50'; // เมื่อความคืบหน้า >= 90% เปลี่ยนเป็นสีเข้ม
    }
    setTimeout(updateProgress, 1000);
  }
};

const handleFileChange = () => {
  progress.value = 0;
  updateProgress();
};
</script>

<template>
  <div class="upload-cv-container">
    <h1>Upload CV or Resume</h1>
    <h3>File PDF PNG JPEG DOCX </h3>
    <p>PNG JPEG Wait another 10 seconds.</p>
    <label for="cv-file" class="custom-file-upload">
      <input type="file" id="cv-file" @change="uploadCV" />
    </label>
    <div class="progress-bar" v-if="showprogress">
      <div class="progress" :style="{ width: progress + '%', backgroundColor: progressColor }"></div>
    </div>
    <br />  <br />
    <button class="cv-download-button" :style="{ backgroundColor: downloadButtonColor }" :disabled="progress < 90">
      <a href="https://convertdocx.onrender.com/api/downloadCV" >Download</a>
    </button>
  </div>
</template>


<style scoped>
p{
  color: red;
}
a{
  text-decoration: none;
}
.upload-cv-container {
 
  text-align: center;
  padding: 20px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 10px;
  max-width: 400px;
  margin: 50px auto;
 
}

.custom-file-upload {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.custom-file-upload:hover {
  background-color: #0056b3;
}

.progress-bar {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 10px;
  height: 30px;
  margin-top: 20px;
}

.progress {
  width: 0;
  height: 100%;
  border-radius: 10px;
}

/* Customize the progress bar color */
.progress-color {
  background-color: #4caf50; /* Green */
}
</style>
import plantDiseaseModel from '../../models/plant_disease/model-loader.js';

class PlantDiseaseService {
  constructor() {
    this.isModelLoaded = false;
    this.simulationMode = false; // Flag for simulation mode
    this.diseaseInfo = {
      'Healthy': {
        description: 'Tanaman Anda terlihat sehat.',
        treatment: 'Lanjutkan perawatan rutin dengan menyiram secukupnya dan berikan pupuk sesuai kebutuhan.',
        prevention: 'Jaga kebersihan area sekitar tanaman dan lakukan pemeriksaan rutin untuk deteksi dini penyakit.'
      },
      'Bacterial Spot': {
        description: 'Bercak bakteri adalah penyakit yang disebabkan oleh bakteri Xanthomonas spp. yang menyebabkan bercak-bercak kecil berwarna coklat atau hitam pada daun, batang, dan buah.',
        treatment: 'Buang bagian tanaman yang terinfeksi. Aplikasikan bakterisida berbahan aktif tembaga atau streptomisin. Hindari menyiram daun secara langsung.',
        prevention: 'Gunakan benih bersertifikat. Jaga jarak tanam yang cukup. Hindari menyiram daun di sore hari. Rotasi tanaman setiap musim.'
      },
      'Early Blight': {
        description: 'Early blight adalah penyakit jamur yang menyebabkan bercak-bercak konsentris pada daun, batang, dan buah. Biasanya dimulai dari daun bagian bawah.',
        treatment: 'Buang daun yang terinfeksi. Aplikasikan fungisida berbahan aktif klorotalonil atau mankozeb. Pastikan drainase tanah baik.',
        prevention: 'Gunakan varietas tahan penyakit. Rotasi tanaman. Jaga jarak tanam yang cukup. Hindari menyiram daun di sore hari.'
      },
      'Late Blight': {
        description: 'Late blight adalah penyakit jamur yang menyebabkan bercak-bercak berair pada daun dan batang, serta pembusukan pada buah. Dapat menyebar dengan cepat dalam kondisi lembab.',
        treatment: 'Buang dan hancurkan bagian tanaman yang terinfeksi. Aplikasikan fungisida berbahan aktif tembaga atau metalaksil. Tingkatkan sirkulasi udara.',
        prevention: 'Gunakan varietas tahan penyakit. Rotasi tanaman. Jaga jarak tanam yang cukup. Hindari menyiram daun di sore hari.'
      },
      'Leaf Mold': {
        description: 'Leaf mold adalah penyakit jamur yang menyebabkan bercak-bercak kuning pada permukaan atas daun dan pertumbuhan jamur berwarna abu-abu di permukaan bawah.',
        treatment: 'Buang daun yang terinfeksi. Aplikasikan fungisida berbahan aktif klorotalonil atau mankozeb. Tingkatkan sirkulasi udara.',
        prevention: 'Gunakan varietas tahan penyakit. Jaga jarak tanam yang cukup. Hindari kelembaban tinggi. Rotasi tanaman.'
      },
      'Yellow Leaf Curl Virus': {
        description: 'Virus keriting daun kuning adalah penyakit virus yang menyebabkan daun mengeriting ke atas dan menguning, serta pertumbuhan tanaman terhambat.',
        treatment: 'Buang tanaman yang terinfeksi. Kendalikan vektor virus (kutu kebul) dengan insektisida. Gunakan perangkap kuning.',
        prevention: 'Gunakan benih bersertifikat. Pasang jaring anti serangga. Kendalikan gulma. Rotasi tanaman.'
      },
      'Mosaic Virus': {
        description: 'Virus mosaik menyebabkan pola mosaik hijau-kuning pada daun, pertumbuhan terhambat, dan daun mengeriting.',
        treatment: 'Buang tanaman yang terinfeksi. Kendalikan vektor virus (kutu daun) dengan insektisida. Gunakan perangkap kuning.',
        prevention: 'Gunakan benih bersertifikat. Pasang jaring anti serangga. Kendalikan gulma. Rotasi tanaman.'
      },
      'Target Spot': {
        description: 'Target spot adalah penyakit jamur yang menyebabkan bercak-bercak konsentris dengan pusat berwarna coklat dan tepi kuning pada daun.',
        treatment: 'Buang daun yang terinfeksi. Aplikasikan fungisida berbahan aktif klorotalonil atau mankozeb. Tingkatkan sirkulasi udara.',
        prevention: 'Gunakan varietas tahan penyakit. Jaga jarak tanam yang cukup. Hindari kelembaban tinggi. Rotasi tanaman.'
      },
      'Spider Mites': {
        description: 'Tungau laba-laba adalah hama kecil yang menghisap cairan tanaman, menyebabkan bintik-bintik kuning pada daun dan jaring halus di permukaan bawah daun.',
        treatment: 'Semprotkan air bertekanan kuat untuk menghilangkan tungau. Aplikasikan minyak hortikultura atau sabun insektisida. Untuk serangan parah, gunakan akarisida.',
        prevention: 'Jaga kelembaban udara yang cukup. Periksa tanaman secara rutin. Introduksi predator alami seperti kumbang ladybug.'
      },
      'Septoria Leaf Spot': {
        description: 'Bercak daun septoria adalah penyakit jamur yang menyebabkan bercak-bercak kecil berwarna coklat dengan pusat abu-abu pada daun.',
        treatment: 'Buang daun yang terinfeksi. Aplikasikan fungisida berbahan aktif klorotalonil atau mankozeb. Pastikan drainase tanah baik.',
        prevention: 'Gunakan varietas tahan penyakit. Rotasi tanaman. Jaga jarak tanam yang cukup. Hindari menyiram daun di sore hari.'
      },
      'Unknown': {
        description: 'Tidak dapat menentukan penyakit dengan pasti. Silakan coba ambil foto dengan pencahayaan yang lebih baik dan fokus pada bagian tanaman yang terinfeksi.',
        treatment: 'Konsultasikan dengan ahli pertanian untuk penanganan yang tepat.',
        prevention: 'Lakukan pemeriksaan rutin pada tanaman dan jaga kebersihan area sekitar tanaman.'
      }
    };
  }

  /**
   * Inisialisasi model
   */
  async initModel() {
    if (!this.isModelLoaded) {
      try {
        const modelLoaded = await plantDiseaseModel.loadModel();
        if (modelLoaded) {
          this.isModelLoaded = true;
          this.simulationMode = false;
          return true;
        } else {
          console.warn('Model tidak dapat dimuat, menggunakan mode simulasi');
          this.simulationMode = true;
          return false;
        }
      } catch (error) {
        console.error('Gagal memuat model:', error);
        this.simulationMode = true;
        return false;
      }
    }
    return true;
  }

  /**
   * Diagnosa penyakit dari gambar
   * @param {HTMLImageElement|File} imageInput - Gambar atau file gambar untuk didiagnosa
   * @returns {Promise<Object>} - Hasil diagnosa
   */
  async diagnosePlant(imageInput) {
    try {
      // Pastikan model sudah dimuat
      if (!this.isModelLoaded) {
        await this.initModel();
      }

      let imgElement;
      
      // Jika input adalah File, konversi ke HTMLImageElement
      if (imageInput instanceof File) {
        imgElement = await this._createImageFromFile(imageInput);
      } else if (imageInput instanceof HTMLImageElement) {
        imgElement = imageInput;
      } else {
        throw new Error('Input harus berupa File atau HTMLImageElement');
      }

      let prediction;
      
      // Jika dalam mode simulasi, berikan hasil simulasi
      if (this.simulationMode) {
        prediction = this._getSimulatedPrediction();
      } else {
        // Lakukan prediksi dengan model
        prediction = await plantDiseaseModel.predict(imgElement);
      }
      
      // Tambahkan informasi penyakit
      const diseaseClass = prediction.className || 'Unknown';
      const result = {
        ...prediction,
        diseaseInfo: this.diseaseInfo[diseaseClass] || this.diseaseInfo['Unknown']
      };

      return result;
    } catch (error) {
      console.error('Gagal melakukan diagnosa:', error);
      // Return unknown prediction with error info
      return {
        className: 'Unknown',
        originalClassName: 'Unknown',
        confidence: 0,
        isConfident: false,
        diseaseInfo: this.diseaseInfo['Unknown'],
        error: error.message
      };
    }
  }

  /**
   * Menghasilkan prediksi simulasi untuk testing
   * @returns {Object} - Hasil prediksi simulasi
   */
  _getSimulatedPrediction() {
    // Pilih penyakit secara acak untuk simulasi
    const diseaseClasses = Object.keys(this.diseaseInfo).filter(cls => cls !== 'Unknown');
    const randomIndex = Math.floor(Math.random() * diseaseClasses.length);
    const className = diseaseClasses[randomIndex];
    
    // Buat nilai confidence acak
    const mainConfidence = 0.5 + Math.random() * 0.4; // 50-90%
    
    // Buat prediksi grup
    const groupedPredictions = diseaseClasses.map(cls => {
      let confidence = cls === className ? mainConfidence : Math.random() * 0.3;
      return { className: cls, confidence };
    }).sort((a, b) => b.confidence - a.confidence);
    
    return {
      className: className,
      originalClassName: `Sample ${className}`,
      confidence: mainConfidence,
      allPredictions: groupedPredictions.map(p => ({
        className: p.className,
        originalClassName: `Sample ${p.className}`,
        confidence: p.confidence
      })),
      groupedPredictions: groupedPredictions,
      isConfident: true
    };
  }

  /**
   * Membuat HTMLImageElement dari File
   * @param {File} file - File gambar
   * @returns {Promise<HTMLImageElement>} - Image element
   */
  _createImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = URL.createObjectURL(file);
    });
  }
}

const plantDiseaseService = new PlantDiseaseService();
export default plantDiseaseService; 
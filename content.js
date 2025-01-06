// content.js
chrome.storage.local.get('extensionEnabled', function (data) {
    // Toggle kapalıysa hiçbir işlem yapma
    if (!data.extensionEnabled) {
      return;
    }
  
    // Sayfadaki tüm "ders kartlarını" seçiyoruz
    const lessonCards = document.querySelectorAll('.card-custom.card-stretch');
  
    // Her kart için işlemler
    lessonCards.forEach((card) => {
      // Not tablolarını bul
      const gradeTable = card.querySelector('table');
      if (!gradeTable) return;
  
      // Tablodaki satırları al
      const gradeRows = gradeTable.querySelectorAll('tbody tr');
  
      // Boş not hücrelerine input ekle
      gradeRows.forEach((row) => {
        const gradeCell = row.querySelector('.text-right');
        if (!gradeCell) return;
  
        // Hücre zaten boşsa input oluştur
        if (!gradeCell.textContent.trim()) {
          gradeCell.innerHTML = `
            <input 
              type="number" 
              class="grade-input"
              style="
                width: 60px; 
                text-align: right;
                border: 1px solid #ccc; 
                border-radius: 4px;
                padding: 2px 4px;
                font-size: 14px;"
            >
          `;
        }
      });
  
      // Not giriş kutularını dinleyerek ortalamayı güncelleyen fonksiyon
      const updateAverageGrade = () => {
        const displayAverageGrade = calculateDisplayAverageGrade(gradeTable);
        const colorScore = calculateColorScore(displayAverageGrade, gradeTable);
  
        // Ortalama satırı var mı kontrol et, yoksa ekle
        let averageGradeRow = gradeTable.querySelector('.average-grade-row');
        if (!averageGradeRow) {
          averageGradeRow = document.createElement('tr');
          averageGradeRow.classList.add('average-grade-row');
          gradeTable.querySelector('tbody').appendChild(averageGradeRow);
        }
  
        // Ortalama satırını güncelle
        averageGradeRow.innerHTML = `
          <td></td>
          <td class="font-weight-bold">Ortalama</td>
          <td class="text-right font-weight-bold">
            <span style="color: ${getColorForGrade(colorScore)}; font-weight: bold">
              ${displayAverageGrade.toFixed(2)}
            </span>
          </td>
        `;
      };
  
      // Tüm inputları seç
      const gradeInputs = gradeTable.querySelectorAll('.grade-input');
  
      // Her inputun değişiminde ortalamayı güncelle
      gradeInputs.forEach((input) => {
        // Sadece 0-100 ve ondalık sayı girişine izin ver (virgülü noktaya çevir)
        // Harf veya sembol girişini engelle, 0'dan az, 100'den fazla değere de izin verme
        input.addEventListener('keypress', (e) => {
          const char = String.fromCharCode(e.which);
          // 0-9, nokta, backspace, silme vb. haricini engelle
          if (!/[0-9.]/.test(char) && e.keyCode !== 8 && e.keyCode !== 46) {
            e.preventDefault();
          }
        });
  
        // Kullanıcı input'a bir şey yazdığında virgülü noktaya çevir
        input.addEventListener('input', (e) => {
          // Virgül girildiyse '.' yap
          if (e.target.value.includes(',')) {
            e.target.value = e.target.value.replace(',', '.');
          }
          // Değer numeric değilse veya boşsa hemen çık
          if (isNaN(e.target.value) || e.target.value === '') {
            return;
          }
          // 0-100 arası clamp
          let val = parseFloat(e.target.value);
          if (val < 0) val = 0;
          if (val > 100) val = 100;
          e.target.value = val;
  
          updateAverageGrade();
        });
      });
  
      // Sayfa yüklendiğinde ilk hesaplama
      updateAverageGrade();
    });
  
    // Ortalama hesaplayan fonksiyon
    function calculateDisplayAverageGrade(gradeTable) {
      const gradeRows = gradeTable.querySelectorAll('tbody tr');
      let totalGrade = 0;
      let totalWeight = 0;
  
      gradeRows.forEach((row) => {
        const gradeCell = row.querySelector('.text-right');
        if (!gradeCell) return;
        const gradeInput = gradeCell.querySelector('.grade-input');
  
        // Kullanıcı input'u veya hücredeki metin (virgülü '.' yapıyoruz)
        let gradeText = gradeInput
          ? gradeInput.value.trim()
          : gradeCell.textContent.trim();
        gradeText = gradeText.replace(',', '.');
  
        const grade = parseFloat(gradeText);
  
        // İlk sütunda yazan oran (virgülü '.' yap)
        const ratioText = row.querySelector('td:first-child').textContent.trim();
        const ratioValue = parseFloat(ratioText.replace(',', '.'));
  
        if (!isNaN(grade) && !isNaN(ratioValue)) {
          // (grade * ratio) / 100
          totalGrade += (grade * ratioValue) / 100;
          totalWeight += ratioValue;
        }
      });
  
      // Bölme hatasına karşı kontrol
      return totalWeight > 0 ? totalGrade : 0;
    }
  
    // Renge esas olacak skoru hesaplayan fonksiyon
    function calculateColorScore(calculatedGrade, gradeTable) {
      const gradeRows = gradeTable.querySelectorAll('tbody tr');
      let totalWeight = 0;
  
      gradeRows.forEach((row) => {
        const gradeCell = row.querySelector('.text-right');
        if (!gradeCell) return;
        const gradeInput = gradeCell.querySelector('.grade-input');
        let gradeText = gradeInput
          ? gradeInput.value.trim()
          : gradeCell.textContent.trim();
        gradeText = gradeText.replace(',', '.');
  
        const ratioText = row.querySelector('td:first-child').textContent.trim();
        const ratio = parseFloat(ratioText.replace(',', '.'));
  
        // Not ve oran girilmişse
        if (!isNaN(parseFloat(gradeText)) && !isNaN(ratio)) {
          totalWeight += ratio;
        }
      });
  
      // colorScore = (ortalama * 100) / toplamOran
      return totalWeight > 0 ? (calculatedGrade * 100) / totalWeight : 0;
    }
  
    // Ortalamaya göre rengi dön
    function getColorForGrade(colorScore) {
      if (colorScore > 75) {
        return 'green';
      } else if (colorScore >= 55) {
        return 'blue';
      } else {
        return 'red';
      }
    }
  });
  
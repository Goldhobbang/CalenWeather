document.addEventListener('DOMContentLoaded', () => {
    // --- 설정 영역 ---
    const API_KEY = '1678d5fbe5655c5df4baca85f98cc3ed';
    // 다른 도시의 날씨를 보고 싶다면 아래 좌표를 수정하세요. (예: 부산)
    // const CITY_COORDS = { lat: 35.1796, lon: 129.0756 }; // 부산
    const CITY_COORDS = { lat: 37.5665, lon: 126.9780 }; // 현재: 서울

    // --- DOM 요소 ---
    const monthYearTitle = document.getElementById('month-year-title');
    const calendarGridBody = document.getElementById('calendar-grid-body');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const modalContainer = document.getElementById('modal-container');
    const modalDateElem = document.getElementById('modal-date');
    const planInput = document.getElementById('plan-input');
    const savePlanBtn = document.getElementById('save-plan-btn');
    const closeBtn = document.querySelector('.close-btn');

    let currentDate = new Date();
    let selectedDateStr = '';

    // --- 함수 ---

    /** 날씨 정보를 가져와 화면에 표시하는 함수 */
    const fetchWeatherAndDisplay = async () => {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${CITY_COORDS.lat}&lon=${CITY_COORDS.lon}&appid=${API_KEY}&units=metric&lang=kr`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API 오류: ${response.statusText}`);
            }
            const data = await response.json();
            
            const dailyForecasts = {};
            data.list.forEach(item => {
                const date = item.dt_txt.split(' ')[0];
                if (!dailyForecasts[date] && item.dt_txt.includes("12:00:00")) {
                     dailyForecasts[date] = {
                        temp: Math.round(item.main.temp),
                        icon: item.weather[0].icon,
                        desc: item.weather[0].description
                    };
                }
            });

            Object.keys(dailyForecasts).forEach(date => {
                const cell = document.getElementById(`date-${date}`);
                if (cell) {
                    const weather = dailyForecasts[date];
                    const weatherDiv = document.createElement('div');
                    weatherDiv.className = 'weather-info';
                    weatherDiv.innerHTML = `
                        <img src="https://openweathermap.org/img/wn/${weather.icon}.png" alt="${weather.desc}">
                        <span>${weather.temp}°C</span>
                    `;
                    cell.appendChild(weatherDiv);
                }
            });

        } catch (error) {
            console.error("날씨 정보를 가져오는 데 실패했습니다:", error);
        }
    };

    /** 달력을 생성하고 화면에 그리는 함수 */
    const generateCalendar = async () => {
        calendarGridBody.innerHTML = ''; // 기존 달력 초기화
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthYearTitle.textContent = `${year}년 ${month + 1}월`;

        const firstDay = new Date(year, month, 1).getDay(); // 0(일)~6(토)
        const lastDate = new Date(year, month + 1, 0).getDate();
        
        // 1일 이전의 빈 셀 채우기
        for (let i = 0; i < firstDay; i++) {
            calendarGridBody.insertAdjacentHTML('beforeend', '<div class="date-cell empty"></div>');
        }

        // 날짜 셀 생성 (1일부터 마지막 날까지)
        for (let date = 1; date <= lastDate; date++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const today = new Date();
            const isToday = year === today.getFullYear() && month === today.getMonth() && date === today.getDate();
            
            const cell = document.createElement('div');
            cell.className = 'date-cell';
            if (isToday) cell.classList.add('today');
            cell.id = `date-${dateStr}`;
            cell.dataset.date = dateStr;

            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = date;
            cell.appendChild(dateNumber);

            const plan = localStorage.getItem(dateStr);
            if (plan) {
                const planDiv = document.createElement('div');
                planDiv.className = 'plan-preview';
                planDiv.textContent = plan;
                cell.appendChild(planDiv);
            }

            calendarGridBody.appendChild(cell);
        }
        
        // --- ✨ 수정된 부분 시작 ---
        // 마지막 날짜 이후의 빈 셀을 채워 그리드를 완성합니다.
        const totalCells = firstDay + lastDate;
        const remainingCells = 7 - (totalCells % 7);
        
        if (remainingCells < 7) { // 7이면 이미 꽉 찬 상태
            for (let i = 0; i < remainingCells; i++) {
                calendarGridBody.insertAdjacentHTML('beforeend', '<div class="date-cell empty"></div>');
            }
        }
        // --- ✨ 수정된 부분 끝 ---

        await fetchWeatherAndDisplay();
    };

    /** 모달(팝업) 열기 */
    const openModal = (dateStr) => {
        selectedDateStr = dateStr;
        modalDateElem.textContent = dateStr;
        planInput.value = localStorage.getItem(dateStr) || '';
        modalContainer.style.display = 'flex';
    };

    /** 모달 닫기 */
    const closeModal = () => {
        modalContainer.style.display = 'none';
    };

    /** 계획 저장 */
    const savePlan = () => {
        if (planInput.value) {
            localStorage.setItem(selectedDateStr, planInput.value);
        } else {
            localStorage.removeItem(selectedDateStr);
        }
        closeModal();
        generateCalendar();
    };

    // --- 이벤트 리스너 ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar();
    });

    calendarGridBody.addEventListener('click', (e) => {
        const cell = e.target.closest('.date-cell');
        if (cell && !cell.classList.contains('empty')) {
            openModal(cell.dataset.date);
        }
    });

    closeBtn.addEventListener('click', closeModal);
    savePlanBtn.addEventListener('click', savePlan);
    
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });

    // 초기 달력 생성
    generateCalendar();
});
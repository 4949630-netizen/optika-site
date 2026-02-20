// City switcher (Нижний Новгород / Одинцово)
const CITY_STORAGE_KEY = 'optika_city';
const defaultCity = 'nnov';

var FLOAT_PHONE_NUMBERS = { nnov: 'tel:+78311234567', odintsovo: 'tel:+79778855250' };

function setActiveCity(cityId) {
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-city') === cityId);
    });
    document.body.setAttribute('data-current-city', cityId);
    try { localStorage.setItem(CITY_STORAGE_KEY, cityId); } catch (e) {}
    var phoneBtn = document.getElementById('floatPhoneBtn');
    if (phoneBtn && FLOAT_PHONE_NUMBERS[cityId]) {
        phoneBtn.href = FLOAT_PHONE_NUMBERS[cityId];
        phoneBtn.setAttribute('aria-label', cityId === 'odintsovo' ? 'Позвонить в Одинцово' : 'Позвонить в Нижнем Новгороде');
    }
}

document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setActiveCity(btn.getAttribute('data-city'));
    });
});

(function initCity() {
    try {
        const saved = localStorage.getItem(CITY_STORAGE_KEY);
        if (saved === 'nnov' || saved === 'odintsovo') {
            setActiveCity(saved);
        } else {
            document.body.setAttribute('data-current-city', defaultCity);
        }
    } catch (e) {
        document.body.setAttribute('data-current-city', defaultCity);
    }
})();

// Ссылки «Построить маршрут» — маршрут от текущего местоположения до салона
// В rtext Яндекс.Карты порядок: широта, долгота (lat,lon). Иначе точка уезжает (например в район Устюрта)
document.querySelectorAll('.salon-route-link').forEach(function (link) {
    var lat = link.getAttribute('data-lat');
    var lon = link.getAttribute('data-lon');
    if (lat && lon) {
        link.href = 'https://yandex.ru/maps/?rtext=~' + lat + '%2C' + lon;
    }
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
const mobileMenuLinks = mobileMenu?.querySelectorAll('.nav-link');
mobileMenuLinks?.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

// Form submission
const appointmentForm = document.getElementById('appointmentForm');
if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(appointmentForm);
        const data = Object.fromEntries(formData);
        
        // Здесь можно добавить отправку данных на сервер
        console.log('Form data:', data);
        
        alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
        
        // Очистка формы
        appointmentForm.reset();
    });
}

// Set current year in footer
const currentYearElement = document.getElementById('currentYear');
if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}

// Как выглядят наши салоны — одно фото в полном формате, смена стрелками и смахиванием
(function () {
    var viewport = document.getElementById('salonsPhotosViewport');
    var track = document.getElementById('salonsPhotosTrack');
    var prevBtn = document.querySelector('.salons-arrow--prev');
    var nextBtn = document.querySelector('.salons-arrow--next');
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    var slides = track.querySelectorAll('.salons-photo-link');
    var total = slides.length;
    var currentIndex = 0;
    var touchStartX = 0;
    var touchDragOffset = 0;
    var didSwipe = false;

    function updatePosition(index, useTransition) {
        currentIndex = Math.max(0, Math.min(index, total - 1));
        track.style.setProperty('--salons-index', currentIndex);
        track.style.transition = useTransition !== false ? '' : 'none';
        track.classList.toggle('is-dragging', useTransition === false);
    }

    function go(direction) {
        updatePosition(currentIndex + direction);
    }

    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });

    track.style.setProperty('--salons-index', '0');

    viewport.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchDragOffset = 0;
        didSwipe = false;
        track.classList.add('is-dragging');
    }, { passive: true });

    viewport.addEventListener('touchmove', function (e) {
        var x = e.touches[0].clientX;
        touchDragOffset = x - touchStartX;
        if (Math.abs(touchDragOffset) > 20) didSwipe = true;
        var vw = viewport.offsetWidth;
        var slidePercent = 100 / total;
        var base = -currentIndex * slidePercent;
        var dragPercent = (touchDragOffset / vw) * slidePercent;
        track.style.transform = 'translateX(calc(' + (base + dragPercent) + '%))';
    }, { passive: true });

    viewport.addEventListener('touchend', function () {
        track.classList.remove('is-dragging');
        var vw = viewport.offsetWidth;
        var threshold = vw * 0.2;
        if (touchDragOffset < -threshold) {
            go(1);
        } else if (touchDragOffset > threshold) {
            go(-1);
        } else {
            updatePosition(currentIndex);
        }
        track.style.transform = '';
    });

    slides.forEach(function (link) {
        link.addEventListener('click', function (e) {
            if (didSwipe) {
                e.preventDefault();
            }
        });
    });
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        if (href === '#top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const target = document.querySelector(href);
        
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: 'smooth'
            });
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .product-card, .gallery-item, .promo-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// Яндекс.Карты: метки с названиями салонов (нужен API-ключ в index.html: window.YANDEX_MAPS_API_KEY)
var SALONS_NNOV = [
    { name: 'Салон на проспекте Гагарина', address: 'Нижний Новгород, проспект Гагарина, 184', lat: 56.2319, lon: 43.9908 },
    { name: 'Салон на улице Дьяконова', address: 'Нижний Новгород, улица Дьяконова, 24А', lat: 56.2265, lon: 44.0012 },
    { name: 'Салон на улице Веденяпина', address: 'Нижний Новгород, улица Веденяпина, 1А', lat: 56.2250, lon: 43.9850 },
    { name: 'Салон на проспекте Ленина, 113', address: 'Нижний Новгород, проспект Ленина, 113', lat: 56.2680, lon: 44.0480 },
    { name: 'Салон на Бурнаковской', address: 'Нижний Новгород, Бурнаковская улица, 103А', lat: 56.2850, lon: 43.9450 },
    { name: 'Салон на проспекте Ленина, 33', address: 'Нижний Новгород, проспект Ленина, 33', lat: 56.2620, lon: 44.0420 },
    { name: 'Салон на улице Бекетова', address: 'Нижний Новгород, улица Бекетова, 66', lat: 56.2450, lon: 44.0080 },
    { name: 'Салон на улице Коминтерна', address: 'Нижний Новгород, улица Коминтерна, 117', lat: 56.2380, lon: 43.9920 },
    { name: 'Салон на проспекте Ленина, 76', address: 'Нижний Новгород, проспект Ленина, 76', lat: 56.2580, lon: 44.0380 }
];
var SALONS_ODINTSOVO = [
    { name: 'Салон на Можайском шоссе', address: 'Одинцово, Можайское шоссе, 159', lat: 55.6728, lon: 36.9805 }
];

function initYandexSalonsMap(containerId, salons, center, zoom) {
    var container = document.getElementById(containerId);
    if (!container || typeof ymaps === 'undefined' || !salons.length) return;
    var map = new ymaps.Map(containerId, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
    });
    salons.forEach(function (s) {
        var placemark = new ymaps.Placemark([s.lat, s.lon], {
            balloonContentHeader: s.name,
            balloonContentBody: s.address,
            balloonContentFooter: '<a href="https://yandex.ru/maps/?rtext=' + encodeURIComponent(s.address) + '" target="_blank" rel="noopener">Построить маршрут</a>'
        }, { preset: 'islands#orangeDotIconWithCaption', iconCaptionMaxWidth: 120 });
        map.geoObjects.add(placemark);
    });
    if (salons.length > 1) map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 });
    var parent = container.closest('.salons-map');
    if (parent) parent.classList.add('salons-map-api-ready');
}

function initYandexMaps() {
    if (typeof ymaps === 'undefined') return;
    ymaps.ready(function () {
        initYandexSalonsMap('salons-map-nnov', SALONS_NNOV, [56.25, 44.0], 11);
        initYandexSalonsMap('salons-map-odintsovo', SALONS_ODINTSOVO, [55.6728, 36.9805], 16);
    });
}

var yandexKey = window.YANDEX_MAPS_API_KEY && window.YANDEX_MAPS_API_KEY !== 'ВАШ_КЛЮЧ_ЯНДЕКС_КАРТ' ? window.YANDEX_MAPS_API_KEY : '';
if (yandexKey) {
    var s = document.createElement('script');
    s.src = 'https://api-maps.yandex.ru/2.1/?apikey=' + yandexKey + '&lang=ru_RU';
    s.async = true;
    s.onload = initYandexMaps;
    document.head.appendChild(s);
}

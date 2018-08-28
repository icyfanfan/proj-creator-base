import App from '@/components/baseApp';
import Ajax from '@/static/js/request';
import Vue from 'vue';
import '@/static/scss/0_reset.scss';

Vue.prototype.$ajax = Ajax;

new Vue({
    el: '#app',
    render: h => h(App)
});

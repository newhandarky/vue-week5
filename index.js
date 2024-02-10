// 載入VeeValidate 規則
VeeValidate.defineRule("required", VeeValidateRules["required"]);
VeeValidate.defineRule("email", VeeValidateRules["email"]);

// 載入多國語系
VeeValidateI18n.loadLocaleFromURL("./zh_TW.json");
VeeValidate.configure({
  generateMessage: VeeValidateI18n.localize("zh_TW"),
  // 文字輸入時及時驗證
  validateOnInput: true,
});

const apiUrl = 'https://ec-course-api.hexschool.io/v2';
const apiPath = 'newhandarky';

// // 將modal拆解成元件
const userModal = {
  props: [
    // 接收根元件傳來的product物件
    'tempProduct',
    'addToCart'
  ],
  data() {
    return {
      // 建立modal變數準備接實體後的modal
      productModal: {},
      qty: 1,
      status: {
        loading: false
      }
    }
  },
  // 對應x-template的元件ID
  template: '#userProductModal',
  methods: {
    showModal() {
      this.productModal.show()
    },
    closeModal() {
      this.productModal.hide()
    },
    plusProduct() {
      this.qty++
    },
    cutProduct() {
      this.qty--
    }
  },
  watch: {
    // 監聽tempProduct, 點擊到不同產品時將預設數字還原為1
    tempProduct() {
      this.qty = 1
    }
  },
  mounted() {
    // 建立Modal實體
    this.productModal = new bootstrap.Modal(this.$refs.modal)
  }
}



const app = Vue.createApp({
  data() {
    return {
      products: [],
      tempProduct: {},
      // 儲存狀態
      status: {
        // 用來存放讀取product的ID
        addCartLoading: '',
        // 修改購物車數量的
        cartQtyLoading: '',
        // 直接刪除購物車單一品項
        deleteSingleCart: '',
        // 透過數量為1的時候刪除的loading
        deleteSingleCartByQty: '',
        // 刪除全部購物車的loading
        deleteCartLoading: false
      },
      carts: {},
      cartIsEmpty: false,
      // 傳送order的data格式
      form: {
        user: {
          name: '',
          email: '',
          tel: '',
          address: '',
        },
        message: '',
      }
    }
  },
  components: {
    // 載入子元件
    userModal,
  },
  methods: {
    getProducts() {
      axios.get(`${apiUrl}/api/${apiPath}/products/all`)
        .then(res => {
          this.products = res.data.products;
        }).catch(err => {
          Swal.fire({
            title: err.data.message,
          });
        })
    },
    // 接收product參數存在tempProduct
    openModal(product) {
      this.tempProduct = product;
      this.$refs.userModal.showModal();
    },
    // 新增品項至購物車, 預設傳入購物車的數量為1
    addToCart(product_id, qty = 1) {
      const data = {
        product_id,
        qty
      };
      // 將產品加入購物車時也把ID寫入status內的addCartLoading屬性
      this.status.addCartLoading = product_id;
      // 改元件的
      this.$refs.userModal.status.loading = true;
      axios.post(`${apiUrl}/api/${apiPath}/cart`, { data: data })
        .then(res => {
          // 購物車加入完畢後清除樣式
          this.status.addCartLoading = '';
          // 新增完後重新取得購物車資訊
          this.getCarts();
          this.$refs.userModal.closeModal();
          this.$refs.userModal.status.loading = false;
        }).catch(err => {
          this.$refs.userModal.status.loading = false;
          Swal.fire({
            title: err.data.message,
          });
        })
    },
    changeCartQty(cart, qty) {
      const data = {
        product_id: cart.product_id,
        qty
      };
      // 將產品加入購物車時也把ID寫入status內的addCartLoading屬性
      this.status.cartQtyLoading = cart.id;
      axios.put(`${apiUrl}/api/${apiPath}/cart/${cart.id}`, { data: data })
        .then(res => {
          this.getCarts();
          this.status.cartQtyLoading = '';
        }).catch(err => {
          Swal.fire({
            title: err.data.message,
          });
        })
    },
    // 刪除購物車單一品項, 預設是表格左方的刪除鍵
    removeCartItem(id, byQty = false) {
      if(byQty) {
        // 此處為由數量刪除時的loading
        this.status.deleteSingleCartByQty = id;
      }else{
        this.status.deleteSingleCart = id;
      }
      axios.delete(`${apiUrl}/api/${apiPath}/cart/${id}`)
        .then(res => {
          this.getCarts();
        }).catch(err => {
          Swal.fire({
            title: err.data.message,
          });
        })
    },
    removeAllCarts() {
      // 先改狀態呈現讀取中效果
      this.status.deleteCartLoading = true;
      axios.delete(`${apiUrl}/api/${apiPath}/cartsa`)
        .then(res => {
          this.getCarts();          
        }).catch(err => {
          Swal.fire({
            title: err.data.message,
          });
        }).finally(() => { 
          // 修改完畢改回預設false
          this.status.deleteCartLoading = false;
        })
    },
    getCarts() {
      axios.get(`${apiUrl}/api/${apiPath}/cart`)
        .then(res => {
          this.carts = res.data.data
          this.checkCarts();
        }).catch(err => {
          Swal.fire({
            title: err.data.message,
          });
        })
    },
    // 判斷故務車是否為空
    checkCarts() {
      if (this.carts.carts.length === 0) {
        this.cartIsEmpty = true
      } else {
        this.cartIsEmpty = false
      }
    },

    isPhone(value) {
      const phoneNumber = /^(09)[0-9]{8}$/
      return phoneNumber.test(value) ? true : '需要正確的電話號碼'
    },
    sendOrder() {
      const order = this.form
      axios.post(`${apiUrl}/api/${apiPath}/order`, {data: order})
        .then(res => {
          // 清空表格內容
          this.$refs.form.resetForm();
          this.form.message = ''
          this.getCarts();
        }).catch(err => {
          console.log(this.form.message);
          Swal.fire({
            title: err.data.message,
          });
        })
    },
  },

  mounted() {
    // 先抓資料
    this.getProducts();
    this.getCarts()
  },
})

app.component("VForm", VeeValidate.Form);
app.component("VField", VeeValidate.Field);
app.component("ErrorMessage", VeeValidate.ErrorMessage);

app.mount("#app")


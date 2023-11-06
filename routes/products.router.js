const express = require("express");
const router = express.Router();
const Products = require("../schemas/products.schema.js");

//난수 id 생성
const generateRandomString = (num) => {
  const characters = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

router.get("/", (req, res) => {
  res.send("main test");
});

// 상품 목록 조회
router.get("/products", async (req, res) => {
  const productList = await Products.find({});
  const sortList = productList.sort((a, b) => b.createdAt - a.createdAt);

  const resultArray = [];
  sortList.forEach((x) => {
    //console.log(x);
    let newObj = {
      title: x.title,
      author: x.author,
      status: x.status,
      productId: x.productId,
      createdAt: x.createdAt
    };

    resultArray.push(newObj);
  });

  res.json({ data: resultArray });
});

// 상품 상세 목록 조회 (상품ID로 조회)
router.get("/products/:productId", async (req, res) => {
  const { productId } = req.params;
  const existsProducts = await Products.find({ productId });

  if (!productId.length) {
    return res.status(400).json({
      success: false,
      errorMessage: "데이터 형식이 올바르지 않습니다."
    });
  }

  if (existsProducts.length) {
    return res.json({
      title: existsProducts[0].title,
      content: existsProducts[0].content,
      author: existsProducts[0].author,
      status: existsProducts[0].status,
      createdAt: existsProducts[0].createdAt
    });
  } else {
    return res.status(400).json({
      success: false,
      errorMessage: "상품 조회에 실패하였습니다."
    });
  }
});

// 상품 등록
router.post("/products", async (req, res) => {
  const { title, content, author, password } = req.body;

  // 상품 입력을 위한 id, 시간 가져오기
  const status = "FOR_SALE";
  let productId = generateRandomString(30);

  // id 중복 체크
  while (true) {
    let idChk = await Products.find({ productId });
    if (!idChk.length) {
      break;
    }
    productId = generateRandomString(30);
  }

  let createdAt = new Date();

  // 비밀번호 공백시 오류
  if (!password.length) {
    return res.status(400).json({
      success: false,
      errorMessage: "비밀번호를 설정하세요."
    });
  }

  const createdProducts = await Products.create({ productId, title, content, author, password, status, createdAt });
  res.json({ products: createdProducts });
});

// 상품 수정
router.put("/products/:productId", async (req, res) => {
  const { productId } = req.params;
  const { title, content, password, status } = req.body;
  const existsProducts = await Products.find({ productId });

  try {
    //productId 공백 확인
    if (!existsProducts.length) {
      let errMsg = "데이터 형식이 올바르지 않습니다.";
      let errNum = 400;

      if (productId.length > 0) {
        errMsg = "상품 조회에 실패하였습니다.";
        errNum = 404;
      }

      return res.status(errNum).json({
        success: false,
        errorMessage: errMsg
      });
    }

    //
    if (status !== "FOR_SALE" && status !== "SOLD_OUT") {
      return res.status(402).json({
        success: false,
        errorMessage: "상품의 상태는 FOR_SALE, SOLD_OUT만 기입 가능합니다."
      });
    }

    // 비밀번호 일치여부 확인
    if (existsProducts[0].password === password) {
      await Products.updateOne({ productId: productId }, { $set: { title: title, content: content, status: status } });
      return res.status(200).json({ message: "상품 정보를 수정했습니다." });
    } else {
      return res.status(401).json({
        success: false,
        errorMessage: "상품을 수정할 권한이 없습니다."
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({
      success: false,
      errorMessage: "상품 조회에 실패하였습니다." + error
    });
  }
});

// 상품 삭제
router.delete("/products/:productId", async (req, res) => {
  const { productId } = req.params;
  const { password } = req.body;
  const existsProducts = await Products.find({ productId });

  try {
    //console.log(existsProducts[0].password);
    //productId 공백 확인
    if (!existsProducts.length) {
      let errMsg = "데이터 형식이 올바르지 않습니다.";
      let errNum = 400;

      if (productId.length > 0) {
        errMsg = "상품 조회에 실패하였습니다.";
        errNum = 404;
      }

      return res.status(errNum).json({
        success: false,
        errorMessage: errMsg
      });
    }

    // 비밀번호 일치여부 확인
    if (existsProducts[0].password === password) {
      // 삭제 진행

      await Products.deleteOne({ productId });
      return res.status(200).json({ message: "상품을 삭제했습니다." });
    } else {
      return res.status(401).json({
        success: false,
        errorMessage: "상품을 수정할 권한이 없습니다."
      });
    }
  } catch (error) {
    return res.status(404).json({
      success: false,
      errorMessage: "상품 조회에 실패하였습니다." + error
    });
  }
});

module.exports = router;

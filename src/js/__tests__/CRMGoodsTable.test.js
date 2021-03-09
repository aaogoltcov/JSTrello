import puppetteer from 'puppeteer';
import { afterAll, beforeAll, describe, jest, test} from "@jest/globals";
import CRMGoodsTable from "../CRMGoodsTable";

test.each([
  ['should be Nokia', '1', 'Nokia', '1000', 'Nokia'],
  ['should be Samsung', '2', 'Samsung', '2000', 'Samsung'],
  ['should be IPhone', '3', 'IPhone', '3000', 'IPhone'],
])(('it should be %s'), (_, id, name, price, expected) => {
  let table = new CRMGoodsTable();
  table.init();
  table.createTableRow(name, price, id, true);
  expect(expected).toBe(document.querySelector(`td[id="name_${id}"]`).textContent);
});

test('should save to localStorage', () => {
  document.body.innerHTML = '';
  let table = new CRMGoodsTable();
  table.init();
  table.createTableRow('IPhone', '3000', '1', true);
  localStorage.removeItem('goods');
  table.saveToLocalStorage();
  expect(JSON.parse(localStorage.getItem('goods'))).toEqual([{
                                                                            "id": "1",
                                                                            "name": "IPhone",
                                                                            "price": "3000",
                                                                          }]);
})

jest.setTimeout(30000);
describe('CRM table validation form', () => {
  let browser = null;
  let page = null;
  const baseUrl = 'http://localhost:8080';

  beforeAll(async () => {
    browser = await puppetteer.launch({ headless: false,
      devtools: true,
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('CRM table validation form', () => {

    test('should create table', async () => {
      await page.goto(baseUrl);
      // const addGood = await page.$('.btn-create')
      // await addGood.click();
      // const form = await page.$('[id=form]');
      // const input = await form.$('[id=card_number]');
      // await input.type('349230387200275');
      // const submit = await form.$('[id=submitform]');
      // await submit.click();
      // console.log(page.querySelector('.table'))
      await page.waitForSelector('.table');
    });

    test('should validate name', async () => {
      await page.goto(baseUrl);
      const addGood = await page.$('.btn-create');
      await addGood.click();
      const submitButton = await page.$('.btn-save');
      await submitButton.click();
      await page.waitForSelector('.popover');
    })

    test('should create row', async () => {
      await page.goto(baseUrl);
      const addGood = await page.$('.btn-create');
      await addGood.click();
      const goodName = await page.$('[id="name"]');
      const goodPrice = await page.$('[id="price"]');
      await goodName.type('Nokia');
      await goodPrice.type('1000');
      const submitButton = await page.$('.btn-save');
      await submitButton.click();
      await page.waitForSelector('.good');
    })

  });
});

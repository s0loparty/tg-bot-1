// const TelegramBot = require('node-telegram-bot-api')
// const axios = require('axios')
import TelegramBot from "node-telegram-bot-api"
import axios from "axios"

require('dotenv').config()

const BOT_TOKEN = process.env.BOT_TOKEN
const API_WEATHER = process.env.WEATHER_API

const bot = new TelegramBot(BOT_TOKEN, { polling: true })

const buttons = {
	reply_markup: JSON.stringify({
		inline_keyboard: [
			[{text: 'Котики 😼', callback_data: 'cat'}, {text: 'Погода 🌥', callback_data: 'weather'}]
		]
	})
}

let BOT_TYPE = null // cat / weather

bot.on('message', async event => {
	const { from, chat, text } = event

	if (text === '/start') {
		BOT_TYPE = null
		return bot.sendMessage(chat.id, 'Выбери функционал бота \nНапиши /start чтобы перевыбрать', buttons)
	}

	switch (BOT_TYPE) {
		case 'cat':
			const data = await axios('https://aws.random.cat/meow')
			bot.sendPhoto(chat.id, data.data.file, { caption: text })
		break

		case 'weather':
			try {
				const response = await axios(`https://api.weatherapi.com/v1/forecast.json?key=${API_WEATHER}&q=${encodeURI(text)}&days=5&aqi=no&alerts=no&lang=ru`)
				
				if (response.status === 200 && response.data) {
					const data = response.data

					data.forecast.forecastday.forEach(i => {
						const day = i.day
						const date = i.date.split('-').reverse().join('.')

						let mess = ''
						mess += `🌏 *${day.condition.text}* \n`
						//mess += `📍 Город *${data.location.name}* \n`
						mess += `📆 Дата *${date}* \n`
						mess += `🌡 Температура ~ *${day.avgtemp_c}°*`

						bot.sendPhoto(chat.id, 'https:' + day.condition.icon, {
							caption: mess,
							parse_mode: 'markdown'
						})
					})
				} else {
					bot.sendMessage(chat.id, 'Whoops!')
				}
			} catch (error) {
				bot.sendMessage(chat.id, `Город не найден. Либо произошла ошибка (${error.response.status} - ${error.response.statusText})`)
			}
		break
	
		default:
			bot.sendMessage(chat.id, 'Выбери функционал')
		break
	}
})


bot.on('callback_query', async event => {
	const data = event.data
	const chatID = event.message.chat.id
	
	BOT_TYPE = data

	switch (data) {
		case 'cat':
			bot.sendMessage(chatID, 'Котики ванлав, Юхуууу! \nНапиши мне что-то ...')
			break;
		
		case 'weather':
			bot.sendMessage(chatID, 'Посмотрим погоду. Напиши название города')
			break;
	
		default:
			console.log('Wrong callback_data')
			break;
	}
})

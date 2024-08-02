const App = {
    loading: false,
    contracts: {}, // Initialize App.contracts as an empty object
  
    load: async () => {
      await App.loadWeb3();
      await App.loadAccount();
      await App.loadContract();
      await App.render();
    },
  
    loadWeb3: async () => {
      if (window.ethereum) {
        App.web3Provider = window.ethereum;
        window.web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
          console.error("User denied account access", error);
        }
      } else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        console.log('Non-Ethereum browser detected. Please install MetaMask.');
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    },
  
    loadAccount: async () => {
      const accounts = await window.web3.eth.getAccounts();
      App.account = accounts[0];
      console.log("Current account:", App.account);
    },
  
    loadContract: async () => {
      // Create a JavaScript version of the smart contract
      const todoList = await $.getJSON('TodoList.json');

      App.contracts.TodoList = TruffleContract(todoList); // Assign to App.contracts.TodoList
      App.contracts.TodoList.setProvider(App.web3Provider);
  
      // Hydrate the smart contract with values from the blockchain
      App.todoList = await App.contracts.TodoList.deployed();
      console.log("Contract loaded:", App.todoList);
    },
    render: async ()  =>  {
        if(App.loading){
            return
        }

        App.setLoading(true)
        $('#account').html(App.account)

        await App.renderTasks()
        App.setLoading(false)
    },
    renderTasks:async ()  =>  {
        const  taskCount  =  await App.todoList.taskCount()
        const $taskTemplate = $('.taskTemplate')

        for (var i = 1; i <= taskCount; i++) {
            const task  = await App.todoList.tasks(i)
            const taskId = task[0].toNumber()
            const taskContent = task[1]
            const taskCompleted = task[2]

            // Create the html for the task
            const $newTaskTemplate = $taskTemplate.clone()
            $newTaskTemplate.find('.content').html(taskContent)
            $newTaskTemplate.find('input')
                            .prop('name', taskId)
                            .prop('checked', taskCompleted)
                            .on('click', App.toggleCompleted)

            // Put the task in the correct list
            if (taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate)
            } else {
                $('#taskList').append($newTaskTemplate)
            }

            // Show the task
            $newTaskTemplate.show()
        }
    },

    createTask: async () => {
        App.setLoading(true);
        const content = $('#newTask').val(); // Get the task content
        try {
            await App.todoList.createTask(content, { from: App.account }); // Pass the account to pay gas fees
            window.location.reload(); // Reload the page after the task is created
        } catch (error) {
            console.error("Error creating task", error);
            App.setLoading(false); // Ensure loading state is reset even on error
        }
    },
    
    toggleCompleted: async (e) => {
        App.setLoading(true);
        const taskId = e.target.name;
        try {
            await App.todoList.toggleCompleted(taskId, { from: App.account }); // Pass the account to pay gas fees
            window.location.reload(); // Reload the page after toggling completion
        } catch (error) {
            console.error("Error toggling task completion", error);
            App.setLoading(false); // Ensure loading state is reset even on error
        }
    },
    

    setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
          loader.show()
          content.hide()
        } else {
          loader.hide()
          content.show()
        }
    },
  };
  
  $(() => {
    $(window).on('load', () => {
      App.load();
    });
  });
  